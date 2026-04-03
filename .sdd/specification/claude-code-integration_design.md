---
id: "design-claude-code-integration"
title: "Claude Code 連携"
type: "design"
status: "draft"
sdd-phase: "plan"
impl-status: "not-implemented"
created: "2026-03-25"
updated: "2026-03-25"
depends-on: ["spec-claude-code-integration"]
tags: ["claude-code", "ai", "cli", "session", "child-process"]
category: "ai-integration"
priority: "medium"
risk: "high"
---

# Claude Code 連携

**関連 Spec:** [claude-code-integration_spec.md](./claude-code-integration_spec.md)
**関連 PRD:** [claude-code-integration.md](../requirement/claude-code-integration.md)

---

# 1. 実装ステータス

**ステータス:** 🔴 未実装

## 1.1. 実装進捗

| モジュール/機能 | ステータス | 備考 |
|--------------|----------|------|
| ClaudeProcessManager | 🔴 | 子プロセス管理の中核モジュール |
| SessionStore | 🔴 | セッション状態の管理 |
| OutputParser | 🔴 | CLI 出力の解析・構造化 |
| IPC ハンドラー（claude:*） | 🔴 | セッション・コマンド・レビュー系 |
| Preload API（claude） | 🔴 | contextBridge 経由の API 公開 |
| ClaudeSessionPanel | 🔴 | セッション操作 UI |
| ClaudeOutputView | 🔴 | ストリーミング出力表示 UI |
| ReviewCommentList | 🔴 | レビューコメント一覧 UI |

---

# 2. 設計目標

1. **ワークツリー単位のセッション分離** — 各ワークツリーに独立した Claude Code CLI 子プロセスを割り当て、コンテキストの混在を防ぐ（DC_502）
2. **CLI ベースの統合** — Claude API の直接呼び出しではなく、Claude Code CLI を子プロセスとして利用し、認証管理を CLI に委譲する（DC_501）
3. **リアルタイムストリーミング** — 子プロセスの stdout/stderr を IPC イベントでレンダラーに逐次送信し、ユーザーに即座にフィードバックを提供する
4. **Electron セキュリティ準拠** — 子プロセス管理はメインプロセスのみで行い、レンダラーからの直接アクセスを防ぐ（原則 A-001, T-003）
5. **Git 操作の安全性** — Git 操作委譲時は実行前確認を必須とし、不可逆操作を保護する（原則 B-002）

---

# 3. 技術スタック

> 以下はプロジェクト共通の技術スタックです。機能固有の追加技術のみ記載してください。

| 領域 | 採用技術 | 選定理由 |
|------|----------|----------|
| 子プロセス管理 | Node.js `child_process`（spawn） | Electron メインプロセスで利用可能な標準 API。ストリーミング I/O をサポート |
| ANSI パース | ansi-to-html または strip-ansi | Claude Code CLI の出力に含まれる ANSI カラーコードの処理（原則 A-002: Library-First） |
| マークダウン表示 | react-markdown | 解説・レビュー結果のマークダウンレンダリング（原則 A-002） |

<details>
<summary>プロジェクト共通スタック（参考）</summary>

| 領域 | 採用技術 |
|------|----------|
| フレームワーク | Electron 41 + Electron Forge 7 |
| バンドラー | Vite 5 |
| UI | React 19 + TypeScript |
| スタイリング | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| UIコンポーネント | Shadcn/ui |
| Git操作 | simple-git（予定） |
| エディタ | Monaco Editor（予定） |

</details>

---

# 4. アーキテクチャ

## 4.1. システム構成図

```mermaid
graph TD
    subgraph "Renderer Process"
        React[React UI]
        SessionPanel[ClaudeSessionPanel]
        OutputView[ClaudeOutputView]
        ReviewList[ReviewCommentList]
        ExplainView[DiffExplanationView]
        CmdInput[CommandInput]
        StatusInd[SessionStatusIndicator]
        React --> SessionPanel
        React --> OutputView
        React --> ReviewList
        React --> ExplainView
        SessionPanel --> CmdInput
        SessionPanel --> StatusInd
    end

    subgraph "Preload"
        Bridge[contextBridge API]
        ClaudeAPI["claude.* API"]
        Bridge --> ClaudeAPI
    end

    subgraph "Main Process"
        IPCHandler[Claude IPC Handler]
        ProcessMgr[ClaudeProcessManager]
        SessionSt[SessionStore]
        Parser[OutputParser]
        IPCHandler --> ProcessMgr
        IPCHandler --> SessionSt
        ProcessMgr --> SessionSt
        ProcessMgr --> Parser
    end

    subgraph "External"
        CLI1["Claude Code CLI<br/>(Worktree A)"]
        CLI2["Claude Code CLI<br/>(Worktree B)"]
    end

    React -->|"invoke"| Bridge
    Bridge -->|"ipcRenderer"| IPCHandler
    IPCHandler -->|"response"| Bridge
    Bridge -->|"result"| React

    ProcessMgr -->|"spawn"| CLI1
    ProcessMgr -->|"spawn"| CLI2
    CLI1 -->|"stdout/stderr"| ProcessMgr
    CLI2 -->|"stdout/stderr"| ProcessMgr
    ProcessMgr -->|"webContents.send"| Bridge
    Bridge -->|"onOutput/onSessionChanged"| OutputView
```

## 4.2. モジュール分割

| モジュール名 | プロセス | 責務 | 配置場所 |
|------------|---------|------|---------|
| ClaudeProcessManager | main | Claude Code CLI 子プロセスの spawn/kill、stdin 書き込み、stdout/stderr 監視 | `src/processes/main/services/claude-process-manager.ts` |
| SessionStore | main | ワークツリー → セッション情報のマッピング管理（インメモリ） | `src/processes/main/services/claude-session-store.ts` |
| OutputParser | main | CLI の出力テキストを解析し、レビューコメントや解説テキストを構造化データに変換 | `src/processes/main/services/claude-output-parser.ts` |
| Claude IPC Handler | main | `claude:*` IPC チャネルの登録・ルーティング | `src/processes/main/ipc/claude-handler.ts` |
| Claude 型定義 | shared | ClaudeSession, ClaudeCommand, ClaudeOutput 等の型定義 | `src/types/claude.ts` |
| Preload Claude API | preload | contextBridge 経由で claude.* API を公開 | `src/preload.ts`（既存ファイルに追加） |
| ClaudeSessionPanel | renderer | セッション操作 UI（起動/停止/入力/状態） | `src/components/ClaudeSessionPanel.tsx` |
| ClaudeOutputView | renderer | ストリーミング出力表示 | `src/components/ClaudeOutputView.tsx` |
| ReviewCommentList | renderer | レビューコメント一覧 | `src/components/ReviewCommentList.tsx` |
| DiffExplanationView | renderer | 差分解説マークダウン表示 | `src/components/DiffExplanationView.tsx` |
| SessionStatusIndicator | renderer | セッション状態インジケーター | `src/components/SessionStatusIndicator.tsx` |
| CommandInput | renderer | 自然言語入力フィールド | `src/components/CommandInput.tsx` |

---

# 5. データモデル

```typescript
// セッション管理（インメモリ、メインプロセス側）
// SessionStore が管理する内部データ構造
interface InternalSession {
  worktreePath: string;
  status: SessionStatus;
  process: ChildProcess | null; // Node.js ChildProcess インスタンス
  pid: number | null;
  startedAt: string | null;
  error: string | null;
  outputBuffer: ClaudeOutput[]; // 出力履歴バッファ（最大1000件）
}

// ワークツリーパスをキーとするセッションマップ
type SessionMap = Map<string, InternalSession>;
```

---

# 6. インターフェース定義

## 6.1. ClaudeProcessManager

```typescript
// src/processes/main/services/claude-process-manager.ts
import { ChildProcess, spawn } from 'child_process';
import type { ClaudeSession, ClaudeCommand, ClaudeOutput } from '../../types/claude';

export class ClaudeProcessManager {
  /**
   * 指定ワークツリーで Claude Code CLI セッションを起動する。
   * 既にセッションが存在する場合はエラーを返す。
   */
  startSession(worktreePath: string): Promise<ClaudeSession>;

  /**
   * 指定ワークツリーのセッションを終了する。
   * 子プロセスに SIGTERM を送り、タイムアウト後に SIGKILL する。
   */
  stopSession(worktreePath: string): Promise<void>;

  /**
   * Claude Code CLI の stdin にコマンドを書き込む。
   */
  sendCommand(command: ClaudeCommand): Promise<void>;

  /**
   * 指定ワークツリーのセッション情報を取得する。
   */
  getSession(worktreePath: string): ClaudeSession | null;

  /**
   * 全セッション情報を取得する。
   */
  getAllSessions(): ClaudeSession[];

  /**
   * 全セッションを終了する（アプリ終了時に呼び出す）。
   */
  stopAllSessions(): Promise<void>;

  /**
   * 出力イベントのリスナーを登録する。
   */
  onOutput(listener: (output: ClaudeOutput) => void): void;

  /**
   * セッション状態変更イベントのリスナーを登録する。
   */
  onSessionChanged(listener: (session: ClaudeSession) => void): void;
}
```

## 6.2. SessionStore

```typescript
// src/processes/main/services/claude-session-store.ts
import type { ClaudeSession, ClaudeOutput } from '../../types/claude';

export class SessionStore {
  /**
   * セッションを登録する。
   */
  set(worktreePath: string, session: InternalSession): void;

  /**
   * セッションを取得する。
   */
  get(worktreePath: string): InternalSession | null;

  /**
   * セッションを削除する。
   */
  delete(worktreePath: string): void;

  /**
   * 全セッション情報を取得する。
   */
  getAll(): ClaudeSession[];

  /**
   * 指定セッションの出力履歴を取得する。
   */
  getOutputHistory(worktreePath: string): ClaudeOutput[];

  /**
   * 出力を履歴バッファに追加する。
   */
  appendOutput(worktreePath: string, output: ClaudeOutput): void;

  /**
   * セッションが存在するか確認する。
   */
  has(worktreePath: string): boolean;
}
```

## 6.3. OutputParser

```typescript
// src/processes/main/services/claude-output-parser.ts
import type { ReviewComment } from '../../types/claude';

export class OutputParser {
  /**
   * CLI 出力テキストからレビューコメントを抽出する。
   * Claude Code の出力フォーマットに依存するため、パース失敗時は
   * 生テキストをそのまま返すフォールバックを持つ。
   */
  parseReviewComments(output: string): ReviewComment[];

  /**
   * CLI 出力テキストから解説テキストを抽出する。
   */
  parseExplanation(output: string): string;

  /**
   * ANSI エスケープコードを除去する。
   */
  stripAnsi(text: string): string;

  /**
   * ANSI エスケープコードを HTML に変換する。
   */
  ansiToHtml(text: string): string;
}
```

## 6.4. IPC ハンドラー（メインプロセス側）

```typescript
// src/processes/main/ipc/claude-handler.ts
import { ipcMain, BrowserWindow } from 'electron';
import type { IPCResult } from '../../types/ipc';
import type { ClaudeSession, ClaudeCommand, ClaudeOutput, ReviewComment } from '../../types/claude';

export function registerClaudeIPCHandlers(
  processManager: ClaudeProcessManager,
  mainWindow: BrowserWindow,
): void {
  // セッション管理
  ipcMain.handle('claude:start-session', async (_event, args: { worktreePath: string }): Promise<IPCResult<ClaudeSession>> => {
    try {
      const session = await processManager.startSession(args.worktreePath);
      return { success: true, data: session };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: { code: 'SESSION_START_FAILED', message } };
    }
  });

  ipcMain.handle('claude:stop-session', async (_event, args: { worktreePath: string }): Promise<IPCResult<void>> => {
    try {
      await processManager.stopSession(args.worktreePath);
      return { success: true, data: undefined };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: { code: 'SESSION_STOP_FAILED', message } };
    }
  });

  ipcMain.handle('claude:get-session', async (_event, args: { worktreePath: string }): Promise<IPCResult<ClaudeSession | null>> => {
    const session = processManager.getSession(args.worktreePath);
    return { success: true, data: session };
  });

  ipcMain.handle('claude:get-all-sessions', async (): Promise<IPCResult<ClaudeSession[]>> => {
    return { success: true, data: processManager.getAllSessions() };
  });

  // コマンド実行
  ipcMain.handle('claude:send-command', async (_event, command: ClaudeCommand): Promise<IPCResult<void>> => {
    try {
      await processManager.sendCommand(command);
      return { success: true, data: undefined };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: { code: 'COMMAND_SEND_FAILED', message } };
    }
  });

  // 出力取得
  ipcMain.handle('claude:get-output', async (_event, args: { worktreePath: string }): Promise<IPCResult<ClaudeOutput[]>> => {
    const session = processManager.getSession(args.worktreePath);
    if (!session) {
      return { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'セッションが見つかりません' } };
    }
    // SessionStore から出力履歴を取得
    return { success: true, data: [] }; // 実装時に SessionStore から取得
  });

  // レビュー・解説（非同期、結果はイベントで通知）
  ipcMain.handle('claude:review-diff', async (_event, args): Promise<IPCResult<void>> => {
    try {
      // 差分取得 → プロンプト構築 → sendCommand
      // 結果は claude:review-result イベントで非同期通知
      return { success: true, data: undefined };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: { code: 'REVIEW_FAILED', message } };
    }
  });

  ipcMain.handle('claude:explain-diff', async (_event, args): Promise<IPCResult<void>> => {
    try {
      // 差分取得 → プロンプト構築 → sendCommand
      // 結果は claude:explain-result イベントで非同期通知
      return { success: true, data: undefined };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: { code: 'EXPLAIN_FAILED', message } };
    }
  });

  // ストリーミング出力のイベント転送
  processManager.onOutput((output: ClaudeOutput) => {
    mainWindow.webContents.send('claude:output', output);
  });

  processManager.onSessionChanged((session: ClaudeSession) => {
    mainWindow.webContents.send('claude:session-changed', session);
  });
}
```

## 6.5. Preload API（contextBridge 経由）

```typescript
// src/preload.ts に追加
// claude 名前空間
claude: {
  startSession: (args: { worktreePath: string }): Promise<IPCResult<ClaudeSession>> =>
    ipcRenderer.invoke('claude:start-session', args),
  stopSession: (args: { worktreePath: string }): Promise<IPCResult<void>> =>
    ipcRenderer.invoke('claude:stop-session', args),
  getSession: (args: { worktreePath: string }): Promise<IPCResult<ClaudeSession | null>> =>
    ipcRenderer.invoke('claude:get-session', args),
  getAllSessions: (): Promise<IPCResult<ClaudeSession[]>> =>
    ipcRenderer.invoke('claude:get-all-sessions'),
  sendCommand: (command: ClaudeCommand): Promise<IPCResult<void>> =>
    ipcRenderer.invoke('claude:send-command', command),
  getOutput: (args: { worktreePath: string }): Promise<IPCResult<ClaudeOutput[]>> =>
    ipcRenderer.invoke('claude:get-output', args),
  reviewDiff: (args: { worktreePath: string; diffTarget: DiffTarget }): Promise<IPCResult<void>> =>
    ipcRenderer.invoke('claude:review-diff', args),
  explainDiff: (args: { worktreePath: string; diffTarget: DiffTarget }): Promise<IPCResult<void>> =>
    ipcRenderer.invoke('claude:explain-diff', args),

  // イベント購読
  onOutput: (callback: (output: ClaudeOutput) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, output: ClaudeOutput) => callback(output);
    ipcRenderer.on('claude:output', handler);
    return () => ipcRenderer.removeListener('claude:output', handler);
  },
  onSessionChanged: (callback: (session: ClaudeSession) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, session: ClaudeSession) => callback(session);
    ipcRenderer.on('claude:session-changed', handler);
    return () => ipcRenderer.removeListener('claude:session-changed', handler);
  },
  onReviewResult: (callback: (result: { worktreePath: string; comments: ReviewComment[]; summary: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, result: { worktreePath: string; comments: ReviewComment[]; summary: string }) => callback(result);
    ipcRenderer.on('claude:review-result', handler);
    return () => ipcRenderer.removeListener('claude:review-result', handler);
  },
  onExplainResult: (callback: (result: { worktreePath: string; explanation: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, result: { worktreePath: string; explanation: string }) => callback(result);
    ipcRenderer.on('claude:explain-result', handler);
    return () => ipcRenderer.removeListener('claude:explain-result', handler);
  },
},
```

## 6.6. レンダラー側の型定義

```typescript
// src/types/electron.d.ts に追加
interface ElectronAPI {
  // ... 既存の repository, settings, onError ...

  claude: {
    startSession(args: { worktreePath: string }): Promise<IPCResult<ClaudeSession>>;
    stopSession(args: { worktreePath: string }): Promise<IPCResult<void>>;
    getSession(args: { worktreePath: string }): Promise<IPCResult<ClaudeSession | null>>;
    getAllSessions(): Promise<IPCResult<ClaudeSession[]>>;
    sendCommand(command: ClaudeCommand): Promise<IPCResult<void>>;
    getOutput(args: { worktreePath: string }): Promise<IPCResult<ClaudeOutput[]>>;
    reviewDiff(args: { worktreePath: string; diffTarget: DiffTarget }): Promise<IPCResult<void>>;
    explainDiff(args: { worktreePath: string; diffTarget: DiffTarget }): Promise<IPCResult<void>>;
    onOutput(callback: (output: ClaudeOutput) => void): () => void;
    onSessionChanged(callback: (session: ClaudeSession) => void): () => void;
    onReviewResult(callback: (result: { worktreePath: string; comments: ReviewComment[]; summary: string }) => void): () => void;
    onExplainResult(callback: (result: { worktreePath: string; explanation: string }) => void): () => void;
  };
}
```

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|------|----------|
| セッション起動5秒以内 (NFR-001) | spawn は非同期。起動中は `starting` 状態を即座に UI 反映し、プロセス起動完了後に `running` に遷移 |
| ストリーミング遅延100ms以内 (NFR-002) | stdout/stderr の `data` イベントを即座に IPC イベントとして送信。バッファリングは最小限（16KB チャンク） |
| 自動再接続3回 (NFR-003) | ClaudeProcessManager が `exit` イベントで異常終了を検知し、指数バックオフ（1s, 2s, 4s）で再起動を試行 |
| プロセスサンドボックス (NFR-004) | spawn の `cwd` オプションでワークツリーパスを設定。環境変数は必要最小限のみ継承 |

---

# 8. テスト戦略

| テストレベル | 対象 | カバレッジ目標 |
|------------|------|------------|
| ユニットテスト | ClaudeProcessManager（モック child_process） | >= 80% |
| ユニットテスト | SessionStore（インメモリ状態管理） | >= 80% |
| ユニットテスト | OutputParser（レビューコメント/解説パース） | >= 80% |
| ユニットテスト | Claude IPC Handler（モック ProcessManager） | >= 80% |
| 結合テスト | メインプロセス ↔ Preload ↔ レンダラー間の IPC 連携 | 主要フロー |
| E2Eテスト | セッション起動/停止、コマンド送信、出力表示 | 主要ユースケース |
| コンポーネントテスト | ClaudeSessionPanel, ClaudeOutputView, ReviewCommentList | >= 60% |

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項 | 選択肢 | 決定内容 | 理由 |
|----------|--------|----------|------|
| Claude Code との通信方式 | A) Claude API 直接呼び出し / B) Claude Code CLI 子プロセス | B) CLI 子プロセス | DC_501 の制約。認証管理を CLI に委譲でき、CLI のバージョンアップに追従しやすい。ユーザーが既にインストール・認証済みの CLI をそのまま利用 |
| セッション管理の永続化 | A) electron-store で永続化 / B) インメモリのみ | B) インメモリのみ | セッション（子プロセス）はアプリ終了時に消滅するため永続化不要。アプリ起動時はクリーンな状態から開始 |
| 出力のバッファリング | A) 全出力を保持 / B) 最大件数で制限 | B) 最大1000件で制限 | メモリ使用量の制御。長時間のセッションで出力が蓄積しすぎることを防ぐ |
| レビュー結果の取得方式 | A) リクエスト/レスポンス（同期的） / B) リクエスト→イベント通知（非同期的） | B) イベント通知 | CLI の出力はストリーミングであり、完了タイミングが不定。IPC invoke は即座に応答を返し、結果は別イベントで通知 |
| 子プロセスの終了方式 | A) SIGKILL 即座 / B) SIGTERM → タイムアウト → SIGKILL | B) SIGTERM + タイムアウト | グレースフルシャットダウン。Claude Code CLI にクリーンアップの機会を与える。タイムアウトは5秒 |
| ストリーミング出力の転送 | A) IPC invoke のポーリング / B) IPC イベント（webContents.send）/ C) MessagePort | B) IPC イベント | リアルタイム性が求められる。ポーリングは遅延が大きい。MessagePort は複雑すぎる。webContents.send が最もシンプル |
| ANSI カラーコード処理 | A) メインプロセスで変換 / B) レンダラーで変換 / C) 除去のみ | B) レンダラーで変換 | メインプロセスの負荷軽減。レンダラー側で HTML に変換して表示 |

## 9.2. 未解決の課題

| 課題 | 影響度 | 対応方針 |
|------|--------|----------|
| Claude Code CLI の出力フォーマット仕様 | 高 | CLI の出力は非構造化テキスト。OutputParser のパースロジックは CLI バージョンに依存する可能性がある。初期実装では正規表現ベースのパースとし、パース失敗時は生テキストをフォールバック表示 |
| Claude Code CLI のインタラクティブモード対応 | 中 | CLI が確認プロンプト（y/n）を出す場合の stdin 制御。初期実装では `--yes` フラグ等の非対話オプションを調査し、対話が必要な場合はレンダラーに確認を委譲 |
| 大量出力時のレンダラーパフォーマンス | 中 | 仮想スクロール（react-window 等）の導入を検討。初期実装では出力件数制限（1000件）で対応 |
| Claude Code CLI のバージョン互換性 | 中 | 起動時に `claude --version` でバージョンチェックを行い、非互換バージョンの場合は警告を表示 |

---

# 10. セキュリティ考慮事項

## 10.1. プロセスサンドボックス

- 子プロセスの `cwd` をワークツリーパスに限定する
- 環境変数は `PATH`、`HOME`、`CLAUDE_*`（CLI 認証情報）のみ継承する
- 子プロセスに shell オプションを `false` に設定し、シェルインジェクションを防ぐ

## 10.2. 入力バリデーション

- `worktreePath` が実在するディレクトリであることを検証する
- `worktreePath` がパストラバーサル攻撃を含まないことを検証する
- `ClaudeCommand.input` の最大長を制限する（例: 10,000文字）
- IPC チャネルの引数型をランタイムでも検証する

## 10.3. 出力の安全性

- CLI からの出力をレンダラーに送信する際、XSS 攻撃を防ぐために HTML エスケープを行う
- ANSI → HTML 変換は信頼できるライブラリを使用する

---

# 11. 変更履歴

## v1.0

**変更内容:**

- 初版作成
- ClaudeProcessManager、SessionStore、OutputParser の設計を定義
- IPC ハンドラー、Preload API、レンダラー型定義を定義
- セキュリティ考慮事項を記載
