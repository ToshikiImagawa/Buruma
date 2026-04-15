---
id: "design-repository-viewer"
title: "リポジトリ閲覧"
type: "design"
status: "approved"
sdd-phase: "plan"
impl-status: "implemented"
created: "2026-03-25"
updated: "2026-04-11"
depends-on: [ "spec-repository-viewer" ]
tags: [ "viewer", "status", "log", "diff", "tauri-migration"]
category: "viewer"
priority: "high"
risk: "medium"
---

# リポジトリ閲覧

**関連 Spec:** [repository-viewer_spec.md](./repository-viewer_spec.md)
**関連 PRD:** [repository-viewer.md](../requirement/repository-viewer.md)

---

# 1. 実装ステータス

**ステータス:** 🟢 実装済み

## 1.1. 実装進捗

| モジュール/機能                   | ステータス | 備考                             |
|----------------------------|-------|--------------------------------|
| GitReadRepository（ステータス）   | 🟢    | git CLI (tokio::process::Command) による status 取得       |
| GitReadRepository（ログ）      | 🟢    | git CLI (tokio::process::Command) による log 取得・ページネーション |
| GitReadRepository（差分）      | 🟢    | git CLI (tokio::process::Command) による diff 取得・パース     |
| GitReadRepository（ブランチ）    | 🟢    | git CLI (tokio::process::Command) による branch 一覧取得     |
| GitReadRepository（ファイルツリー） | 🟢    | git CLI (tokio::process::Command) による ls-tree 取得      |
| IPC ハンドラー（git:*）           | 🟢    | git: 名前空間の IPC チャネル登録          |
| Tauri invoke/listen API（git.*）         | 🟢    | 型安全な  git API 公開   |
| StatusView コンポーネント         | 🟢    | ステータス分類表示 UI                   |
| CommitLog コンポーネント          | 🟢    | コミットログ一覧 UI（スクロールページネーション）     |
| CommitDetailView コンポーネント   | 🟢    | コミット詳細表示 UI                    |
| DiffView コンポーネント           | 🟢    | @monaco-editor/react DiffEditor によるインライン/サイドバイサイド差分表示 |
| RepositoryDetailPanel       | 🟢    | タブ統合コンポーネント（ステータス/コミット/ファイル/リファレンス） |
| ブランチグラフ                    | 🟢    | Canvas API によるブランチグラフ描画。RefMap 連携で HEAD/ブランチ/タグ/リモートのノード種別描画、マージ線の2色分割描画に対応 |
| IPC 入力バリデーション              | 🟢    | worktreePath パストラバーサル防止          |
| ファイルコンテンツ取得 IPC            | 🟢    | git:file-contents / git:file-contents-commit チャネル |
| BranchList コンポーネント         | 🟢    | ブランチ一覧 UI                      |
| FileTree コンポーネント           | 🟢    | ファイルツリー UI                     |
| HunkDiffView コンポーネント       | 🟢    | ハンクベース差分Webview（FR_203_05 実装）  |
| DiffLineRow コンポーネント        | 🟢    | 行番号 + 変更内容の1行表示              |
| CollapsedRegion コンポーネント    | 🟢    | 未変更領域プレースホルダー                |
| FileDiffSection コンポーネント    | 🟢    | ファイルヘッダー + 統計 + 折りたたみ + チェックボックス |
| MultiFileDiffPanel コンポーネント | 🟢    | 複数ファイル縦並びコンテナ（react-virtuoso + AI レビュー/解説ボタン）|
| 表示モード切り替え                  | 🟢    | hunk / monaco トグル（useDiffViewMode Hook）|
| useMultiFileSelection Hook   | 🟢    | Ctrl/Shift+Click 複数選択ロジック     |
| Shiki シンタックスハイライト        | 🟢    | 差分行へのハイライト適用（遅延ロード + フォールバック）|
| StagingArea 複数選択統合         | 🟢    | 一括 stage/unstage ボタン付き        |
| CommitDetailView 複数選択統合    | 🟢    | Ctrl/Shift+Click 選択 + ハイライト  |

---

# 2. 設計目標

1. **パフォーマンス** — 大規模リポジトリ（10万コミット以上）でもスムーズに動作する。ページネーションと仮想スクロールで実現する
2. **型安全な IPC 通信** — すべての git: チャネルに TypeScript 型定義を提供し、`IPCResult<T>` パターンでエラーハンドリングを統一する（原則
   T-001, T-002）
3. **Tauri セキュリティ準拠** — Git 操作はTauri Core (Rust)の GitReadDefaultRepository で実行し、型安全な invoke/listen ラッパー
   経由でWebviewに結果を返す（原則 A-001, T-003）
4. **Library-First** — Git 操作に git CLI (tokio::process::Command)、差分表示に Monaco Editor を活用し、自前実装を最小化する（原則 A-002）
5. **Worktree-First UX** — すべての操作が選択ワークツリーを起点とし、worktreePath を必須引数として渡す（原則 B-001）

---

# 3. 技術スタック

> 以下はプロジェクト共通の技術スタックです。機能固有の追加技術のみ記載してください。

| 領域       | 採用技術                      | 選定理由                                                                                        |
|----------|---------------------------|---------------------------------------------------------------------------------------------|
| Git 操作   | git CLI (tokio::process::Command)                | Rust の tokio::process::Command 経由で git CLI を実行。非同期・並行処理に対応（原則 A-002）                        |
| 差分表示 | @monaco-editor/react + monaco-editor | React ラッパー経由で Monaco DiffEditor を統合。CDN から worker を自動ロードし、Tauri + Vite 環境での worker 設定問題を回避。インライン/サイドバイサイド切替、シンタックスハイライトを標準サポート |
| 仮想スクロール | @tanstack/react-virtual | 大規模コミットログの描画パフォーマンス確保。React 19 対応、軽量（原則 A-002） |
| diff パース | 自前パーサー（diff-parser.ts） | `git diff` の raw 出力を `FileDiff[]` にパース。Monaco DiffEditor にはファイル全体テキストを IPC 経由で取得して渡す |
| シンタックスハイライト | Shiki | TextMate グラマーベースの高精度ハイライト。遅延ロード対応（原則 A-002） |

<details>
<summary>プロジェクト共通スタック（参考）</summary>

| 領域              | 採用技術                                     |
|----------------|------------------------------------------|
| フレームワーク      | Tauri 2.x                                |
| バックエンド言語    | Rust (edition 2021+)                     |
| バンドラー          | Vite 6                                   |
| UI                | React 19 + TypeScript 5.x                |
| スタイリング        | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| UIコンポーネント    | Shadcn/ui                                |
| Git 操作            | `tokio::process::Command` 経由の `git` CLI   |
| ファイル監視        | `notify` + `notify-debouncer-full` crate |
| 永続化              | `tauri-plugin-store`                     |
| ダイアログ          | `tauri-plugin-dialog`                    |
| エディタ            | Monaco Editor                            |
| Rust 非同期        | `tokio`                                  |
| Rust エラー        | `thiserror` + `AppError`                 |
| Rust テスト        | `cargo test` + `mockall`                 |
| DI (Webview)        | VContainer                               |
| DI (Rust)           | `tauri::State<T>` + `Arc<dyn Trait>`     |

</details>

---

# 4. アーキテクチャ

## 4.1. システム構成図

```mermaid
graph TD
    subgraph "Renderer Process"
        Panel[RepositoryDetailPanel]
        StatusView[StatusView]
        CommitLog[CommitLog + ブランチグラフ]
        CommitDetailView[CommitDetailView]
        DiffView["DiffView (@monaco-editor/react)"]
        BranchList[BranchList]
        FileTree[FileTree]
        VM[ViewModel + Hook]
        Panel --> StatusView
        Panel --> CommitLog
        Panel --> CommitDetailView
        Panel --> DiffView
        Panel --> BranchList
        Panel --> FileTree
        StatusView --> VM
        CommitLog --> VM
        DiffView --> VM
    end

    subgraph "Tauri Runtime"
        Runtime["Tauri Runtime<br/>(Webview ↔ Core IPC)"]
        GitAPI["git.* API (10 channels)"]
        Runtime --> GitAPI
    end

    subgraph "Main Process (Clean Architecture)"
        IPCHandlers[IPC Handlers + Validation]
        UseCases[UseCases x10]
        GitReadRepo[GitReadDefaultRepository]
        SimpleGit[git CLI (tokio::process::Command)]
        IPCHandlers --> UseCases
        UseCases --> GitReadRepo
        GitReadRepo --> SimpleGit
    end

    Panel -->|"invoke"| Runtime
    Runtime -->|"invoke<T>"| IPCHandlers
    IPCHandlers -->|"IPCResult"| Runtime
    Runtime -->|"result"| Panel
```

## 4.2. モジュール分割

> **注記**: 初版設計書ではフラット構造（`src-tauri/src/services/git.ts` 等）で記述していたが、実装ではプロジェクトの Clean Architecture 4層 + feature ディレクトリ構成に合わせて再配置した。

> **注記**: Tauri Core (Rust) 側の DI は `tauri::State<AppState>` + `Arc<dyn Trait>` パターンで実装。以下の TypeScript 風コード例は仕様の概要を示すものであり、実装は Rust で行われている。

### Tauri Core (Rust)側

| モジュール名 | 層 | 責務 | 配置場所 |
|---|---|---|---|
| GitReadRepository IF | application | Git 読み取り操作の抽象インターフェース | `src-tauri/src/features/repository_viewer/application/repositories/git_read_repository.rs` |
| GitReadDefaultRepository | infrastructure | git CLI (tokio::process::Command) による Git 操作の実装 | `src-tauri/src/features/repository_viewer/infrastructure/repositories/git_read_default_repository.rs` |
| diff-parser | infrastructure | `git diff` raw 出力の `FileDiff[]` パーサー | `src-tauri/src/features/repository_viewer/infrastructure/repositories/diff_parser.rs` |
| file-tree-builder | infrastructure | `git ls-tree` + status からのファイルツリー構築 | `src-tauri/src/features/repository_viewer/infrastructure/repositories/file_tree_builder.rs` |
| UseCase x10 | application | 各 Git 操作の UseCase（1クラス1操作） | `src-tauri/src/features/repository_viewer/application/usecases/` |
| IPC ハンドラー | presentation | git:* IPC チャネル登録 + 入力バリデーション | `src-tauri/src/features/repository_viewer/presentation/commands.rs` |

### Webview 側

| モジュール名 | 層 | 責務 | 配置場所 |
|---|---|---|---|
| GitViewerRepository IF | application | IPC 経由の Git 読み取りインターフェース（status, log, diff 等 8 メソッド。file-contents は DiffViewModel が直接取得するため含まない） | `src/features/repository-viewer/application/repositories/git-viewer-repository.ts` |
| GitViewerDefaultRepository | infrastructure | `invokeCommand('git_*', ...)` への委譲実装（IPC 経由） | `src/features/repository-viewer/infrastructure/repositories/git-viewer-default-repository.ts` |
| RepositoryViewerService | application | 選択コミット・差分モード等の状態管理（BehaviorSubject） | `src/features/repository-viewer/application/services/` |
| UseCase x8 | application | GetStatus, GetLog, GetCommitDetail, GetDiff, GetDiffStaged, GetDiffCommit, GetBranches, GetFileTree | `src/features/repository-viewer/application/usecases/` |
| ViewModel x5 + Hook x5 | presentation | StatusVM, CommitLogVM, DiffViewVM, BranchListVM, FileTreeVM | `src/features/repository-viewer/presentation/` |
| RepositoryDetailPanel | presentation | タブ統合コンポーネント（ステータス/コミット/ファイル/リファレンス）。ResizablePanelGroup による分割パネルリサイズ対応 | `src/features/repository-viewer/presentation/components/RepositoryDetailPanel.tsx` |
| BranchGraphCanvas | presentation | Canvas API によるブランチグラフ描画。RefMap でノード種別（HEAD=二重丸、ローカル=大円、タグ=角丸四角、リモート=菱形）を描き分け。マージ線は垂直区間（子の色）と斜め区間（第1親=子の色、第2親=親の色）の2色分割描画 | `src/features/repository-viewer/presentation/components/BranchGraphCanvas.tsx` |
| RefMap (buildRefMap) | presentation | BranchList + TagInfo[] からハッシュ→ref情報のマッピングを構築する純粋関数（TagInfo は `src/domain/index.ts` に定義） | `src/features/repository-viewer/presentation/ref-map.ts` |
| StatusView 他 6 コンポーネント | presentation | 各ビューの React UI コンポーネント | `src/features/repository-viewer/presentation/components/` |

### 共有

| モジュール名 | 責務 | 配置場所 |
|---|---|---|
| domain 型定義 | GitStatus, CommitSummary, FileDiff, BranchList, FileTreeNode, FileContents 等 | `src/domain/index.ts` |
| IPC チャネル型定義 | `git_*` 10 チャネルの型定義 | `src/lib/ipc.ts` |
| GraphLayout 型定義 | ブランチグラフのノード・レーン情報（GraphNode, GraphLayout） | `src/lib/graph/types.ts` |
| computeGraphLayout | CommitSummary.parents からレーン割り当てを計算するアルゴリズム | `src/lib/graph/compute-graph-layout.ts` |
| FileChangeIcon | ファイル変更ステータス（added/modified/deleted/renamed）に応じたアイコン表示コンポーネント。StatusView・StagingArea で共有 | `src/components/FileChangeIcon.tsx` |
| Tauri invoke/listen API | 型安全な git.* API 公開 | （preload 層は Tauri では不要。`@tauri-apps/api` の invoke/listen を直接使用） |

---

# 5. データモデル

```typescript
// git status --porcelain=v1 出力から GitStatus への変換
// 各行の先頭2文字（index, workTree）でステータスを判定
function parseStatusOutput(raw: string): GitStatus {
  const staged: FileChange[] = []
  const unstaged: FileChange[] = []
  const untracked: string[] = []
  for (const line of raw.split('\n')) {
    if (line.length < 3) continue
    const index = line[0], workTree = line[1], filePath = line.slice(3)
    if (index === '?' && workTree === '?') { untracked.push(filePath); continue }
    if (index !== ' ' && index !== '?') staged.push({ path: filePath, status: toFileChangeStatus(index) })
    if (workTree !== ' ' && workTree !== '?') unstaged.push({ path: filePath, status: toFileChangeStatus(workTree) })
  }
  return { staged, unstaged, untracked }
}

// 差分表示用のファイルコンテンツ取得
interface FileContents {
  original: string   // 変更前テキスト（git show HEAD:path）
  modified: string   // 変更後テキスト（ファイル読み込み or git show :path）
  language: string   // Monaco 言語 ID
}
```

---

# 6. インターフェース定義

## 6.1. IPC チャネル一覧

| チャネル名 | 引数 | 戻り値 | 備考 |
|---|---|---|---|
| `git_status` | `{ worktreePath }` | `IPCResult<GitStatus>` | |
| `git_log` | `GitLogQuery` | `IPCResult<GitLogResult>` | `--graph --all` でブランチグラフ付き |
| `git_commit_detail` | `{ worktreePath, hash }` | `IPCResult<CommitDetail>` | |
| `git_diff` | `GitDiffQuery` | `IPCResult<FileDiff[]>` | ワーキングツリーの差分 |
| `git_diff_staged` | `GitDiffQuery` | `IPCResult<FileDiff[]>` | ステージ済みの差分 |
| `git_diff_commit` | `{ worktreePath, hash, filePath? }` | `IPCResult<FileDiff[]>` | コミット差分 |
| `git_branches` | `{ worktreePath }` | `IPCResult<BranchList>` | |
| `git_file_tree` | `{ worktreePath }` | `IPCResult<FileTreeNode>` | |
| `git_file_contents` | `{ worktreePath, filePath, staged? }` | `IPCResult<FileContents>` | Monaco DiffEditor 用ファイル全体取得 |
| `git_file_contents_commit` | `{ worktreePath, hash, filePath }` | `IPCResult<FileContents>` | コミット差分の Monaco 用 |

全チャネルで `worktreePath` のパストラバーサル防止バリデーションを実施。

## 6.2. DiffView コンポーネント（@monaco-editor/react 統合）

```tsx
// src/features/repository-viewer/presentation/components/DiffView.tsx
// @monaco-editor/react の DiffEditor を使用
// ファイル全体テキストを git_file_contents IPC で取得して渡す

import { DiffEditor } from '@monaco-editor/react'

// onMount でエディタ参照を取得し、updateOptions でインライン/サイドバイサイドを切替
// useInlineViewWhenSpaceIsLimited: false で狭い画面でも強制的にサイドバイサイド表示
```

## 6.3. ブランチグラフ

```typescript
// CommitSummary.parents（親コミットハッシュ配列）から
// computeGraphLayout() でレーン割り当てを計算し、GraphLayout を生成
// BranchGraphCanvas コンポーネントで Canvas API により描画

// src/lib/graph/types.ts
interface GraphNode {
  hash: string
  parents: string[]
  lane: number        // 割り当てられたレーン番号
  parentLanes: number[]
}

interface GraphLayout {
  nodes: GraphNode[]
  maxLane: number
  hashToIndex: Map<string, number>
}

// BranchGraphCanvas: Canvas でノードとエッジを描画
// レーンごとに色分け、可視範囲のみ描画して大量コミットでも高速
//
// ノード種別描画（RefMap 連携）:
//   HEAD: 二重丸（外側リング + 内側塗りつぶし）
//   ローカルブランチ: 大きめ塗りつぶし円
//   タグ: 角丸四角形
//   リモートブランチ: ダイヤモンド形
//   通常コミット: 標準塗りつぶし円
//
// エッジ色分けルール:
//   同一レーン: そのレーンの色で直線描画
//   異なるレーン（垂直区間）: 子のレーン色（上書き防止）
//   異なるレーン（斜め区間）: 第1親=子の色、第2親以降=親の色
//
// CommitItem に ref バッジ（HEAD/ローカル/リモート/タグ）を DOM で表示
// buildRefMap() で BranchList + TagInfo[] → hash→RefInfo マッピングを構築
```

---

# 7. 非機能要件実現方針

| 要件                             | 実現方針                                                                                         |
|--------------------------------|----------------------------------------------------------------------------------------------|
| ステータス表示2秒以内 (NFR_201)          | git CLI (tokio::process::Command) の status() は内部で `git status --porcelain` を使用し高速。変換処理も O(n) で軽量                    |
| コミットログ初期表示1秒以内 (NFR_202)       | `--max-count=50` で取得件数を制限。仮想スクロール（@tanstack/react-virtual）で DOM 描画を最小化。スクロール時にオンデマンドで次ページを取得 |
| 差分表示1秒以内 (NFR_203)             | git CLI (tokio::process::Command) の diff() で生の diff 文字列を取得し、Tauri Core (Rust)でパース。Monaco Editor の DiffEditor はネイティブ実装で高速描画    |
| Tauri セキュリティ (A-001, T-003) | Git 操作は GitReadDefaultRepository（Tauri Core (Rust)）に閉じ込め、型安全な invoke/listen ラッパー 経由でのみアクセス                           |

---

# 8. テスト戦略

| テストレベル     | 対象                                                          | カバレッジ目標         |
|------------|-------------------------------------------------------------|-----------------|
| ユニットテスト    | GitReadDefaultRepository（status, log, diff, branch, file-tree） | ≥ 80%           |
| ユニットテスト    | diff パース関数（parseDiffOutput）                                 | ≥ 90%（エッジケース含む） |
| ユニットテスト    | データ変換関数（mapStatusResult, mapCommitSummary, mapBranchResult） | ≥ 90%           |
| コンポーネントテスト | StatusView, CommitLog, BranchList, FileTree                 | ≥ 60%           |
| 結合テスト      | IPC ハンドラー（git:* チャネル）                                       | 主要フロー           |
| E2Eテスト     | ステータス表示、コミットログ閲覧、差分表示切替                                     | 主要ユースケース        |
| パフォーマンステスト | NFR_201〜NFR_203 の各目標値                                       | 自動計測            |

**テストツール:** Vitest + Testing Library（CONSTITUTION 技術スタック制約準拠）

**モック戦略:**

- GitReadDefaultRepository のテストでは git CLI (tokio::process::Command) をモック化（実際の Git リポジトリに依存しない）
- コンポーネントテストでは IPC 呼び出しをモック化
- E2E テストでは実際の Git リポジトリ（テスト用の fixture リポジトリ）を使用

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項           | 選択肢                                                           | 決定内容                               | 理由                                                                                                     |
|----------------|---------------------------------------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------|
| Git 操作ライブラリ    | git CLI (tokio::process::Command) / git2 crate / isomorphic-git / tokio::process::Command 直接      | git CLI (tokio::process::Command)                         | CONSTITUTION 技術スタック制約で指定。Rust の tokio::process::Command 経由で git CLI を非同期実行（原則 A-002）                             |
| 差分表示エンジン       | Monaco Editor / CodeMirror / react-diff-viewer / 自前実装         | Monaco Editor                      | CONSTITUTION 技術スタック制約で指定。DiffEditor を標準搭載、シンタックスハイライト組み込み、VS Code との親和性（原則 A-002）                      |
| コミットログの仮想スクロール | @tanstack/react-virtual / react-window / react-virtualized    | @tanstack/react-virtual            | React 19 対応、軽量（6KB gzip）、hooks ベース API。react-window は unmaintained（原則 A-002）                           |
| IPC チャネル命名     | `git_status` / `repository_viewer_status`                     | `git_{action}` 形式                    | ドメイン（git）ベースの命名で直感的。application-foundation の `repository_{action}` と一貫性がある                               |
| diff パース方式 | git CLI (tokio::process::Command) の diffSummary / raw diff をパース / unified-diff ライブラリ | 自前パーサー + ファイル全体取得 IPC | diffSummary はファイル統計のみ。Monaco DiffEditor にはファイル全体テキスト（`git show HEAD:path` + ファイル読み込み）を渡す方が正確な差分表示が可能 |
| ファイルツリー取得方式 | `git ls-tree` / fs.readdir 再帰 / git CLI (tokio::process::Command) raw | `git ls-tree -r HEAD` + status マージ | Git 管理下のファイルのみ表示。status をマージすることで変更ファイルのマーキングも実現 |
| Monaco Editor 統合方式 | monaco-editor 直接 / @monaco-editor/react / CodeMirror | @monaco-editor/react | Tauri + Vite 環境での worker 設定問題を回避。CDN 経由で worker を自動ロード。`updateOptions` による表示モード切替、`useInlineViewWhenSpaceIsLimited: false` で狭い画面でもサイドバイサイド表示を強制 |
| ブランチグラフ方式 | git log --graph + ASCII パース / クライアント側レーン計算 + Canvas 描画 / 外部ライブラリ | クライアント側レーン計算 + Canvas 描画 | `CommitSummary.parents` から `computeGraphLayout()` でレーン割り当てを計算し、`BranchGraphCanvas` で Canvas API 描画。ASCII パース方式より柔軟なレイアウト制御が可能で、大量コミットでも可視範囲のみ描画して高速 |
| TagInfo / useTagViewModel の cross-feature 参照 | A) useTagViewModel を直接参照 / B) TagInfo を shared/domain に移動し props 経由 | B) TagInfo は `src/domain/` に定義済み。useTagViewModel は cross-feature 参照として許容（タグデータを CommitLog に props で供給するため） | A-004 準拠: TagInfo はドメイン型として shared に属すべき。ViewModel の cross-feature import は UI 統合上の実用的判断として記録 |

## 9.2. 未解決の課題

| 課題 | 影響度 | 対応状況 |
|---|---|---|
| Monaco Editor の Vite 6 + Tauri での統合方法 | 高 | **解決済み**: `@monaco-editor/react` を使用し CDN 経由で worker を自動ロード |
| 大規模ファイル（10000行超）の差分表示パフォーマンス | 中 | Monaco Editor の minimap 無効化、scrollBeyondLastLine 無効化で対応。超大規模ファイルは今後の課題 |
| ブランチグラフの描画ライブラリ | 低 | **解決済み**: `CommitSummary.parents` からレーン計算 + Canvas API 描画（`BranchGraphCanvas`） |
| git CLI (tokio::process::Command) の同時実行制御 | 中 | 未対応。現時点で問題は報告されていないが、同一リポジトリへの並行操作でロック競合の可能性あり |

---

# 10. 変更履歴

## v4.1 (2026-04-11)

**コード品質改善（/simplify レビュー）**

- `FileChangeIcon` を `StatusView.tsx` からローカル定義を削除し、`src/components/FileChangeIcon.tsx` に共有コンポーネントとして抽出（basic-git-operations の `StagingArea` と共有）
- `RepositoryDetailPanel` の `loadAllDiffs` useEffect から不要な `statusViewMode` 依存を除去（表示モード切替時に同一データの不要な IPC 再取得が発生していたバグを修正）
- `CommitLog` の不要な WHAT コメント（`// コンテナサイズの取得`、`// スクロール追跡`）を削除
- `CommitDetailView` のインラインアイコン表示を共有 `FileChangeIcon` に置換
- `FileChangeIcon` の `status` prop を `string` → `FileChangeStatus` に型安全化、`copied` ケースを追加
- `src/shared/` フラット化: ドキュメント内パス参照を `src/domain/`・`src/lib/` に更新

## v4.0 (2026-04-09)

**Tauri 2 + Rust 移行（Electron からの全面刷新、破壊的変更）**

- 実装ステータスを `implemented` → `not-implemented` にリセット（旧 Electron 実装は凍結）
- 技術スタック表を Tauri 2 + Rust + Vite 6 + tokio + git CLI shell out + notify + tauri-plugin-store + tauri-plugin-dialog + thiserror 版に全面刷新
- システム構成図を Webview (React) / Tauri Core (Rust) の 2 境界分割に更新
- モジュール分割表を `src/features/{feature-name}/` (TypeScript) + `src-tauri/src/features/{feature_name}/` (Rust) の 2 部構成に
- IPC Handler コード例を `ipcMain.handle` から Rust `#[tauri::command]` に置換
- Preload API ブロックを削除（Tauri では preload 不要）
- IPC チャネル名を snake_case (command) / kebab-case (event) に変換
- DI 記述を Webview (VContainer) と Rust (`tauri::State<T>` + `Arc<dyn Trait>`) の 2 部構成に
- `simple-git` → `tokio::process::Command` 経由の `git` CLI shell out 方式に変更
- `chokidar` → `notify` + `notify-debouncer-full` crate に置換
- `electron-store` → `tauri-plugin-store` に置換
- `child_process.spawn` → `tokio::process::Command` に置換
- DC_001 を「Tauri セキュリティ制約」（CSP + capabilities + 入力バリデーション）に書き換え

**移行ガイド:**

```typescript
// ❌ 旧コード (Electron)
const result = await window.electronAPI.repository.open()
if (result.success) { /* ... */ }

// ✅ 新コード (Tauri)
import { invokeCommand } from '@/shared/lib/invoke'
const result = await invokeCommand<RepositoryInfo | null>('repository_open')
if (result.success) { /* ... */ }
```

```rust
// ✅ Rust 側 (新規)
#[tauri::command]
pub async fn repository_open(
    state: State<'_, AppState>,
) -> AppResult<Option<RepositoryInfo>> {
    state.open_repository_dialog_usecase.invoke().await
}
```

---

## v3.0 (2026-04-05)

**変更内容:**

- BranchGraphCanvas に RefMap 連携を追加（HEAD/ブランチ/タグ/リモートのノード種別描画）
- マージ線の色分けを2色分割描画に変更（垂直区間=子の色、斜め区間=第1親は子の色/第2親は親の色）
- CommitItem に ref バッジ（HEAD/ローカル/リモート/タグ）を DOM 表示
- `buildRefMap()` 純粋関数を追加（`ref-map.ts`）
- CommitLog に `forwardRef` + `scrollToHash` を追加（ブランチクリックでスクロール）
- `getBranches` を `--no-abbrev` に変更（フルハッシュで RefMap と一致）
- ブランチタブをコミットタブに統合（3パネルレイアウト）、タブを4つに削減
- ResizablePanelGroup による分割パネルリサイズ対応
- Canvas 背景色を `getComputedStyle().backgroundColor` で取得（ライト/ダークモード対応）
- `useTagViewModel` を cross-feature 参照で利用（タグデータを CommitLog に props 経由で供給）

## v2.0 (2026-04-01)

**変更内容:**

- アーキテクチャをフラット構造から Clean Architecture 4層 + feature ディレクトリ構成に変更
- `GitService` を `GitReadRepository` IF + `GitReadDefaultRepository` 実装に分離（DI 対応）
- 差分表示を `@monaco-editor/react` DiffEditor に変更（ファイル全体テキストを IPC で取得）
- `git:file-contents` / `git:file-contents-commit` IPC チャネルを追加
- ブランチグラフ表示を追加（`CommitSummary.parents` → `computeGraphLayout()` → `BranchGraphCanvas` Canvas 描画）
- IPC ハンドラーに `worktreePath` パストラバーサル防止バリデーションを追加
- `RepositoryDetailPanel` タブ統合コンポーネントを追加（ステータス/コミット/ファイル/リファレンス）
- Webview 側に ViewModel + Hook パターン、RepositoryViewerService（状態管理）を追加
- 仕様書のフィールド名を `FileChange.type` → `FileChange.status` に統一（既存 worktree-management との整合性）
- `impl-status` を `implemented` に更新
- 未解決課題（Monaco 統合、ブランチグラフ）を解決済みに更新

## v1.0 (2026-03-25)

**変更内容:**

- 初版作成
- GitService、IPC ハンドラー、Tauri invoke/listen API、Webviewコンポーネントの設計を定義
- Monaco Editor による差分表示の設計を定義
- 仮想スクロールによるコミットログのパフォーマンス設計を定義
