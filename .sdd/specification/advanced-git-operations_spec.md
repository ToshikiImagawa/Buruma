---
id: "spec-advanced-git-operations"
title: "高度な Git 操作"
type: "spec"
status: "approved"
sdd-phase: "specify"
created: "2026-03-25"
updated: "2026-04-09"
depends-on: ["prd-advanced-git-operations"]
tags: ["git", "merge", "rebase", "stash", "cherry-pick", "conflict", "tag"]
category: "git-operations"
priority: "medium"
risk: "high"
---

# 高度な Git 操作

**関連 Design Doc:** [advanced-git-operations_design.md](./advanced-git-operations_design.md)
**関連 PRD:** [advanced-git-operations.md](../requirement/advanced-git-operations.md)

---

# 1. 背景

Buruma はワークツリーを主軸とした Git GUI アプリケーションであり、基本的な Git 操作（コミット、プッシュ、プル等）に加えて、マージ、リベース、スタッシュ、チェリーピック、コンフリクト解決、タグ管理といった上級 Git 操作を GUI で安全かつ効率的に提供する必要がある。

これらの操作は Git 中級者〜上級者が日常的に使用するものであり、CLI と同等以上の操作性を視覚的なフィードバックと安全性確認を伴って提供する。特にマージ・リベース時のコンフリクト解決は、3ウェイマージ表示による視覚的な解決 UI が求められる。

本仕様は PRD [advanced-git-operations.md](../requirement/advanced-git-operations.md) の要求（UR_401〜UR_404, FR_401〜FR_406, NFR_401, DC_401）を実現するための論理設計を定義する。

# 2. 概要

高度な Git 操作は以下の6つのサブシステムで構成される：

1. **マージ** — ブランチのマージ実行（fast-forward / no-ff 選択）、中止対応（FR_401）
2. **リベース** — 通常リベースおよびインタラクティブリベース（コミット編集・並べ替え・squash）、中止対応（FR_402）
3. **スタッシュ** — 変更の一時退避・復元・削除・一覧表示（FR_403）
4. **チェリーピック** — 特定コミットの選択適用、複数コミットの一括適用（FR_404）
5. **コンフリクト解決** — 3ウェイマージ表示、ours/theirs 一括採用、手動編集、解決済みマーク（FR_405）
6. **タグ管理** — タグの作成（lightweight / annotated）・削除・一覧表示（FR_406）

すべての操作は原則 B-002（Git 操作の安全性）に準拠し、不可逆な操作には確認ステップを設ける。操作中は常に中止（abort）オプションを提供する（DC_401）。

# 3. 要求定義

## 3.1. 機能要件 (Functional Requirements)

| ID | 要件 | 優先度 | 根拠 (PRD) |
|--------|------|------|------|
| FR-001 | マージ対象ブランチの選択 UI を提供する | 必須 | FR_401_01 |
| FR-002 | マージ方式（fast-forward / no-ff）の選択を提供する | 必須 | FR_401_02 |
| FR-003 | マージ実行と結果（成功/コンフリクト発生）の表示を行う | 必須 | FR_401_03 |
| FR-004 | マージの中止（`git merge --abort`）を提供する | 必須 | FR_401_04 |
| FR-005 | コンフリクト発生時にコンフリクト解決 UI へ遷移する | 必須 | FR_401_05 |
| FR-006 | リベース対象ブランチの選択 UI を提供する | 推奨 | FR_402_01 |
| FR-007 | インタラクティブリベースのコミット一覧表示を提供する | 推奨 | FR_402_02 |
| FR-008 | コミットの並べ替え・squash・edit・drop 操作を提供する | 推奨 | FR_402_03 |
| FR-009 | リベースの実行と進行状況表示を行う | 推奨 | FR_402_04 |
| FR-010 | リベースの中止（`git rebase --abort`）を提供する | 推奨 | FR_402_05 |
| FR-011 | 現在の変更をスタッシュに退避する（メッセージ付き） | 推奨 | FR_403_01 |
| FR-012 | スタッシュ一覧の表示（メッセージ、日時、変更内容プレビュー）を提供する | 推奨 | FR_403_02 |
| FR-013 | スタッシュの復元（pop / apply）を提供する | 推奨 | FR_403_03 |
| FR-014 | スタッシュの個別削除（drop）を提供する | 推奨 | FR_403_04 |
| FR-015 | スタッシュの全削除（clear）を確認ダイアログ付きで提供する | 推奨 | FR_403_05 |
| FR-016 | コミットログからのコミット選択を提供する | 任意 | FR_404_01 |
| FR-017 | 単一コミットのチェリーピックを提供する | 任意 | FR_404_02 |
| FR-018 | 複数コミットの一括チェリーピックを提供する | 任意 | FR_404_03 |
| FR-019 | チェリーピック時のコンフリクト解決 UI への遷移を提供する | 任意 | FR_404_04 |
| FR-020 | コンフリクトファイルの一覧表示を提供する | 必須 | FR_405_01 |
| FR-021 | 3ウェイマージ表示（ours / theirs / merged result）を提供する | 必須 | FR_405_02 |
| FR-022 | ours（自分の変更）の一括採用を提供する | 必須 | FR_405_03 |
| FR-023 | theirs（相手の変更）の一括採用を提供する | 必須 | FR_405_04 |
| FR-024 | 手動編集による解決を提供する | 必須 | FR_405_05 |
| FR-025 | 解決済みファイルのマーク（`git add`）を提供する | 必須 | FR_405_06 |
| FR-026 | 全コンフリクト解決後のマージ/リベース続行を提供する | 必須 | FR_405_07 |
| FR-027 | lightweight タグの作成を提供する | 任意 | FR_406_01 |
| FR-028 | annotated タグの作成（メッセージ付き）を提供する | 任意 | FR_406_02 |
| FR-029 | タグの削除を確認ダイアログ付きで提供する | 任意 | FR_406_03 |
| FR-030 | タグ一覧の表示（名前、対象コミット、日時）を提供する | 任意 | FR_406_04 |

## 3.2. 非機能要件 (Non-Functional Requirements)

| ID | カテゴリ | 要件 | 目標値 | 根拠 (PRD) |
|---------|------|------|------|------|
| NFR-001 | 性能 | マージ・リベース操作の進行状況フィードバック | 500ms以内 | NFR_401 |
| NFR-002 | 性能 | 操作完了の通知 | 30秒以内 | NFR_401 |
| NFR-003 | 安全性 | 不可逆操作には確認ダイアログを表示する | 必須 | DC_401, B-002 |
| NFR-004 | 安全性 | マージ・リベース中は abort オプションを常時表示する | 必須 | DC_401 |

# 4. API

## 4.1. IPC API（Tauri Core ↔ Webview）

### 4.1.1. マージ操作（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `git_merge` | ブランチのマージを実行する | `MergeOptions` | `MergeResult` |
| `git_merge_abort` | マージを中止する | `{ worktreePath: string }` | `void` |
| `git_merge_status` | 現在のマージ状態を取得する | `{ worktreePath: string }` | `MergeStatus` |

### 4.1.2. リベース操作（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `git_rebase` | リベースを実行する | `RebaseOptions` | `RebaseResult` |
| `git_rebase_interactive` | インタラクティブリベースを実行する | `InteractiveRebaseOptions` | `RebaseResult` |
| `git_rebase_abort` | リベースを中止する | `{ worktreePath: string }` | `void` |
| `git_rebase_continue` | リベースを続行する | `{ worktreePath: string }` | `RebaseResult` |
| `git_rebase_get_commits` | リベース対象コミット一覧を取得する | `{ worktreePath: string; onto: string }` | `RebaseStep[]` |

### 4.1.3. スタッシュ操作（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `git_stash_save` | 変更をスタッシュに退避する | `StashSaveOptions` | `void` |
| `git_stash_list` | スタッシュ一覧を取得する | `{ worktreePath: string }` | `StashEntry[]` |
| `git_stash_pop` | スタッシュを復元して削除する | `{ worktreePath: string; index: number }` | `void` |
| `git_stash_apply` | スタッシュを復元する（削除しない） | `{ worktreePath: string; index: number }` | `void` |
| `git_stash_drop` | スタッシュを個別削除する | `{ worktreePath: string; index: number }` | `void` |
| `git_stash_clear` | スタッシュを全削除する | `{ worktreePath: string }` | `void` |

### 4.1.4. チェリーピック操作（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `git_cherry_pick` | コミットをチェリーピックする | `CherryPickOptions` | `CherryPickResult` |
| `git_cherry_pick_abort` | チェリーピックを中止する | `{ worktreePath: string }` | `void` |

> **注記**: マージおよびチェリーピックのコンフリクト解決後の続行は、専用の continue コマンドではなく `git_commit`（basic-git-operations）を使用する。リベースのみ専用の `git_rebase_continue` コマンドを持つ。

### 4.1.5. コンフリクト解決操作（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `git_conflict_list` | コンフリクトファイル一覧を取得する | `{ worktreePath: string }` | `ConflictFile[]` |
| `git_conflict_file_content` | コンフリクトファイルの3ウェイ内容を取得する | `{ worktreePath: string; filePath: string }` | `ThreeWayContent` |
| `git_conflict_resolve` | コンフリクトを解決する（ファイル単位） | `ConflictResolveOptions` | `void` |
| `git_conflict_resolve_all` | 全コンフリクトを一括解決する（ours/theirs） | `ConflictResolveAllOptions` | `void` |
| `git_conflict_mark_resolved` | 解決済みファイルをマークする（git add） | `{ worktreePath: string; filePath: string }` | `void` |

### 4.1.6. タグ操作（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `git_tag_list` | タグ一覧を取得する | `{ worktreePath: string }` | `TagInfo[]` |
| `git_tag_create` | タグを作成する | `TagCreateOptions` | `void` |
| `git_tag_delete` | タグを削除する | `{ worktreePath: string; tagName: string }` | `void` |

### 4.1.7. 進捗通知（Events, Core → Webview `emit` / `listen`）

| Event 名 | 概要 | ペイロード |
|---------|------|-----------|
| `git-progress` | 操作の進行状況を通知する（basic-git-operations と共通） | `OperationProgress` |

> **IPCResult<T> 互換**: Webview 側は `src/lib/invoke/commands.ts` の `invokeCommand<T>` ラッパーを経由して呼び出す。

## 4.2. React コンポーネント API

| コンポーネント | Props | 概要 |
|--------------|-------|------|
| `MergeDialog` | `MergeDialogProps` | マージ対象ブランチの選択とマージ方式の設定ダイアログ |
| `RebaseEditor` | `RebaseEditorProps` | インタラクティブリベースのコミット操作エディタ |
| `StashManager` | `StashManagerProps` | スタッシュ一覧の表示と操作（退避・復元・削除）パネル |
| `CherryPickDialog` | `CherryPickDialogProps` | チェリーピック対象コミットの選択ダイアログ |
| `ConflictResolver` | `ConflictResolverProps` | コンフリクト解決 UI（3ウェイマージ表示 + 手動編集） |
| `TagManager` | `TagManagerProps` | タグ一覧表示と作成・削除パネル |
| `OperationProgressBar` | `OperationProgressBarProps` | Git 操作の進捗バー |
| `DestructiveActionConfirmDialog` | `DestructiveActionConfirmDialogProps` | 不可逆操作の確認ダイアログ |

### コンポーネント Props 定義

```typescript
// マージダイアログ
interface MergeDialogProps {
  worktreePath: string;
  currentBranch: string;
  branches: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMergeComplete: (result: MergeResult) => void;
}

// リベースエディタ
interface RebaseEditorProps {
  worktreePath: string;
  currentBranch: string;
  steps: RebaseStep[];
  onExecute: (steps: RebaseStep[]) => void;
  onAbort: () => void;
}

// スタッシュマネージャー
interface StashManagerProps {
  worktreePath: string;
  stashes: StashEntry[];
  onSave: (message?: string) => void;
  onPop: (index: number) => void;
  onApply: (index: number) => void;
  onDrop: (index: number) => void;
  onClear: () => void;
}

// チェリーピックダイアログ
interface CherryPickDialogProps {
  worktreePath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCherryPickComplete: (result: CherryPickResult) => void;
}

// コンフリクト解決
interface ConflictResolverProps {
  worktreePath: string;
  conflictFiles: ConflictFile[];
  operationType: 'merge' | 'rebase' | 'cherry-pick';
  onResolve: (filePath: string, resolution: ConflictResolution) => void;
  onResolveAll: (strategy: 'ours' | 'theirs') => void;
  onMarkResolved: (filePath: string) => void;
  onContinue: () => void;
  onAbort: () => void;
}

// タグマネージャー
interface TagManagerProps {
  worktreePath: string;
  tags: TagInfo[];
  onCreateTag: (options: TagCreateOptions) => void;
  onDeleteTag: (tagName: string) => void;
}

// 進捗バー
interface OperationProgressBarProps {
  progress: OperationProgress;
  onAbort?: () => void;
}

// 破壊的操作確認ダイアログ
interface DestructiveActionConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

## 4.3. 型定義

```typescript
// === マージ関連 ===

interface MergeOptions {
  worktreePath: string;
  branch: string;
  strategy: 'fast-forward' | 'no-ff';
}

interface MergeResult {
  status: 'success' | 'conflict' | 'already-up-to-date';
  conflictFiles?: string[];
  mergeCommit?: string;
}

interface MergeStatus {
  isMerging: boolean;
  branch?: string;
  conflictFiles?: string[];
}

// === リベース関連 ===

interface RebaseOptions {
  worktreePath: string;
  onto: string;
}

interface InteractiveRebaseOptions {
  worktreePath: string;
  onto: string;
  steps: RebaseStep[];
}

interface RebaseStep {
  hash: string;
  message: string;
  action: RebaseAction;
  order: number;
}

type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';

interface RebaseResult {
  status: 'success' | 'conflict' | 'aborted';
  conflictFiles?: string[];
  currentStep?: number;
  totalSteps?: number;
}

// === スタッシュ関連 ===

interface StashSaveOptions {
  worktreePath: string;
  message?: string;
  includeUntracked?: boolean;
}

interface StashEntry {
  index: number;
  message: string;
  date: string; // ISO 8601
  branch: string;
  hash: string;
}

// === チェリーピック関連 ===

interface CherryPickOptions {
  worktreePath: string;
  commits: string[]; // コミットハッシュの配列
}

interface CherryPickResult {
  status: 'success' | 'conflict';
  conflictFiles?: string[];
  appliedCommits: string[];
}

// === コンフリクト解決関連 ===

interface ConflictFile {
  filePath: string;
  status: 'conflicted' | 'resolved';
  conflictType: 'content' | 'rename' | 'delete';
}

interface ThreeWayContent {
  base: string;   // 共通祖先
  ours: string;   // 自分の変更
  theirs: string;  // 相手の変更
  merged: string;  // 現在のマージ結果（コンフリクトマーカー付き）
}

interface ConflictResolveOptions {
  worktreePath: string;
  filePath: string;
  resolution: ConflictResolution;
}

type ConflictResolution =
  | { type: 'ours' }
  | { type: 'theirs' }
  | { type: 'manual'; content: string };

interface ConflictResolveAllOptions {
  worktreePath: string;
  strategy: 'ours' | 'theirs';
}

// === タグ関連 ===

interface TagInfo {
  name: string;
  hash: string;
  message?: string; // annotated タグの場合のみ
  date: string; // ISO 8601
  type: 'lightweight' | 'annotated';
  tagger?: string;
}

interface TagCreateOptions {
  worktreePath: string;
  tagName: string;
  commitHash?: string; // 省略時は HEAD
  type: 'lightweight' | 'annotated';
  message?: string; // annotated タグの場合に必須
}

// === 進捗通知 ===

interface OperationProgress {
  operationType: 'merge' | 'rebase' | 'cherry-pick';
  status: 'in-progress' | 'completed' | 'failed' | 'conflict';
  message: string;
  currentStep?: number;
  totalSteps?: number;
}

// === IPCResult（application-foundation から再エクスポート） ===

type IPCResult<T> =
  | { success: true; data: T }
  | { success: false; error: IPCError };

interface IPCError {
  code: string;
  message: string;
  detail?: string;
}
```

# 5. 用語集

| 用語 | 説明 |
|------|------|
| マージ | 2つのブランチの変更を統合すること |
| Fast-forward マージ | 分岐がない場合にポインタを進めるだけのマージ。マージコミットは作成されない |
| No-FF マージ | 常にマージコミットを作成するマージ方式 |
| リベース | コミットを別のベースの上に再適用すること |
| インタラクティブリベース | コミットの順序変更・統合・編集を対話的に行うリベース |
| squash | 複数のコミットを1つにまとめること |
| スタッシュ | 作業中の変更を一時的に退避する仕組み |
| チェリーピック | 特定のコミットを別のブランチに適用すること |
| コンフリクト | マージ/リベース時に同じ箇所に異なる変更があり、自動統合できない状態 |
| 3ウェイマージ | 共通祖先(base)、自分の変更(ours)、相手の変更(theirs)の3つを比較するマージ方式 |
| タグ | 特定のコミットに名前を付けるマーカー |

# 6. 使用例

```tsx
import { invokeCommand, listenEvent } from '@/shared/lib/invoke'
import type { MergeResult, StashEntry, ThreeWayContent, OperationProgress } from '@/shared/domain'

// Webview 側：マージの実行
const mergeResult = await invokeCommand<MergeResult>('git_merge', {
  options: { worktreePath: '/path/to/worktree', branch: 'feature/new-feature', strategy: 'no-ff' },
})
if (mergeResult.success && mergeResult.data.status === 'conflict') {
  // コンフリクト解決 UI へ遷移
  navigateToConflictResolver(mergeResult.data.conflictFiles)
}

// Webview 側：スタッシュの一覧取得
const stashList = await invokeCommand<StashEntry[]>('git_stash_list', { worktreePath: '/path/to/worktree' })

// Webview 側：コンフリクトファイルの3ウェイ内容取得
const content = await invokeCommand<ThreeWayContent>('git_conflict_file_content', {
  worktreePath: '/path/to/worktree',
  filePath: 'src/main.ts',
})

// Webview 側：手動編集でコンフリクト解決
await invokeCommand<void>('git_conflict_resolve', {
  options: {
    worktreePath: '/path/to/worktree',
    filePath: 'src/main.ts',
    resolution: { type: 'manual', content: editedContent },
  },
})

// Webview 側：進捗通知の購読
const unlistenProgress = await listenEvent<OperationProgress>('git-progress', (progress) => {
  updateProgressBar(progress)
})

// React コンポーネントの使用例
<MergeDialog
  worktreePath={worktreePath}
  currentBranch="main"
  branches={branches}
  open={isMergeDialogOpen}
  onOpenChange={setIsMergeDialogOpen}
  onMergeComplete={handleMergeComplete}
/>

<ConflictResolver
  worktreePath={worktreePath}
  conflictFiles={conflictFiles}
  operationType="merge"
  onResolve={handleResolve}
  onResolveAll={handleResolveAll}
  onMarkResolved={handleMarkResolved}
  onContinue={handleContinue}
  onAbort={handleAbort}
/>
```

# 7. 振る舞い図

## 7.1. マージ実行フロー

```mermaid
sequenceDiagram
    participant Webview as Webview (React)
    participant Invoke as "@tauri-apps/api/core"
    participant Core as Tauri Core (Rust)
    participant Git as git CLI

    Webview ->> Webview: MergeDialog でブランチ・方式選択
    Webview ->> Invoke: invoke<MergeResult>('git_merge', { options })
    Invoke ->> Core: Tauri IPC
    Core ->> Git: tokio::process::Command: git merge <branch> [--no-ff / --ff-only]

    alt マージ成功
        Git -->> Core: 成功
        Core -->> Invoke: Ok({ status: 'success' })
        Invoke -->> Webview: IPCResult<MergeResult>
        Webview ->> Webview: 成功通知表示
    else コンフリクト発生
        Git -->> Core: コンフリクト
        Core ->> Git: tokio::process::Command: git status --porcelain でコンフリクトファイル取得
        Git -->> Core: コンフリクトファイル一覧
        Core -->> Invoke: Ok({ status: 'conflict', conflictFiles })
        Invoke -->> Webview: IPCResult<MergeResult>
        Webview ->> Webview: ConflictResolver へ遷移
    end
```

## 7.2. コンフリクト解決フロー

```mermaid
sequenceDiagram
    participant Webview as Webview (React)
    participant Invoke as "@tauri-apps/api/core"
    participant Core as Tauri Core (Rust)
    participant Git as git CLI

    Webview ->> Invoke: invoke<ConflictFile[]>('git_conflict_list', { worktreePath })
    Invoke ->> Core: Tauri IPC
    Core ->> Git: tokio::process::Command: git status --porcelain
    Git -->> Core: コンフリクトファイル一覧
    Core -->> Invoke: Ok(Vec<ConflictFile>)
    Invoke -->> Webview: コンフリクトファイル一覧

    loop 各コンフリクトファイル
        Webview ->> Invoke: invoke<ThreeWayContent>('git_conflict_file_content', { filePath })
        Invoke ->> Core: Tauri IPC
        Core ->> Git: tokio::process::Command: git show :1:path / :2:path / :3:path で base/ours/theirs 取得
        Git -->> Core: 3ウェイ内容
        Core -->> Invoke: Ok(ThreeWayContent)
        Invoke -->> Webview: 3ウェイマージ表示

        alt 手動編集で解決
            Webview ->> Invoke: invoke<void>('git_conflict_resolve', { options: { type: 'manual', content } })
            Invoke ->> Core: Tauri IPC
            Core ->> Git: tokio::fs::write でファイル書き込み + git add <filePath>
        else ours/theirs を採用
            Webview ->> Invoke: invoke<void>('git_conflict_resolve', { options: { type: 'ours' or 'theirs' } })
            Invoke ->> Core: Tauri IPC
            Core ->> Git: tokio::process::Command: git checkout --ours/--theirs + git add <filePath>
        end
        Git -->> Core: 解決完了
        Core -->> Invoke: Ok(())
        Invoke -->> Webview: 解決済みマーク更新
    end

    alt リベースの場合
        Webview ->> Invoke: invoke<RebaseResult>('git_rebase_continue', { worktreePath })
        Invoke ->> Core: Tauri IPC
        Core ->> Git: tokio::process::Command: git rebase --continue
        Git -->> Core: 完了
        Core -->> Invoke: Ok(RebaseResult)
        Invoke -->> Webview: 操作完了通知
    else マージ / チェリーピックの場合
        Webview ->> Invoke: invoke<CommitResult>('git_commit', { worktreePath, message })
        Invoke ->> Core: Tauri IPC
        Core ->> Git: tokio::process::Command: git commit -m <message>
        Git -->> Core: 完了
        Core -->> Invoke: Ok(CommitResult)
        Invoke -->> Webview: 操作完了通知
    end
```

## 7.3. インタラクティブリベースフロー

```mermaid
sequenceDiagram
    participant Webview as Webview (React)
    participant Invoke as "@tauri-apps/api/core"
    participant Core as Tauri Core (Rust)
    participant Git as git CLI

    Webview ->> Invoke: invoke<RebaseStep[]>('git_rebase_get_commits', { onto })
    Invoke ->> Core: Tauri IPC
    Core ->> Git: tokio::process::Command: git log <onto>..HEAD
    Git -->> Core: コミット一覧
    Core -->> Invoke: Ok(Vec<RebaseStep>)
    Invoke -->> Webview: RebaseEditor にコミット一覧表示

    Webview ->> Webview: ユーザーがコミットを並べ替え・squash・drop 操作
    Webview ->> Invoke: invoke<RebaseResult>('git_rebase_interactive', { options: { steps } })
    Invoke ->> Core: Tauri IPC
    Core ->> Core: GIT_SEQUENCE_EDITOR 経由で TODO ファイルを書き換え
    Core ->> Git: tokio::process::Command: git rebase -i <onto>

    alt 成功
        Git -->> Core: 成功
        Core ->> Webview: app_handle.emit('git-progress', { status: 'completed' })
    else コンフリクト
        Git -->> Core: コンフリクト
        Core ->> Webview: app_handle.emit('git-progress', { status: 'conflict' })
        Webview ->> Webview: ConflictResolver へ遷移
    end
```

# 8. 制約事項

- Webview から OS API（fs / process / shell）に直接アクセスしない（原則 A-001）
- Git 操作は必ず Tauri Core (Rust) で実行する（原則 A-001）
- IPC 通信は型安全な Tauri command / event を経由する（原則 A-001, T-001）
- 不可逆な操作（stash clear、tag delete）には確認ダイアログを表示する（原則 B-002）
- マージ・リベース中は abort オプションを常に表示する（DC_401）
- インタラクティブリベースは `GIT_SEQUENCE_EDITOR` 環境変数を利用する
- 3ウェイマージ表示には Monaco Editor を使用する（原則 A-002）
- 基本 Git 操作（[basic-git-operations.md](../requirement/basic-git-operations.md)）の実装が前提条件
- force push は本仕様のスコープ外

---

# PRD 整合性確認

| PRD 要求 ID | 本仕様での対応 | ステータス |
|-------------|--------------|----------|
| UR_401 | 仕様全体（6つのサブシステム） | 対応済み |
| UR_402 | FR-001〜FR-010 + `git_merge` / `git_rebase` API | 対応済み |
| UR_403 | FR-011〜FR-015 + `git_stash_*` API | 対応済み |
| UR_404 | FR-020〜FR-026 + `git_conflict_*` API | 対応済み |
| FR_401 | FR-001〜FR-005 + MergeDialog + `git_merge` API | 対応済み |
| FR_401_01 | FR-001（マージ対象ブランチ選択） | 対応済み |
| FR_401_02 | FR-002（マージ方式選択） | 対応済み |
| FR_401_03 | FR-003（マージ実行と結果表示） | 対応済み |
| FR_401_04 | FR-004（マージ中止） | 対応済み |
| FR_401_05 | FR-005（コンフリクト解決 UI 遷移） | 対応済み |
| FR_402 | FR-006〜FR-010 + RebaseEditor + `git_rebase` API | 対応済み |
| FR_402_01 | FR-006（リベース対象ブランチ選択） | 対応済み |
| FR_402_02 | FR-007（コミット一覧表示） | 対応済み |
| FR_402_03 | FR-008（コミット操作） | 対応済み |
| FR_402_04 | FR-009（リベース実行・進行状況表示） | 対応済み |
| FR_402_05 | FR-010（リベース中止） | 対応済み |
| FR_403 | FR-011〜FR-015 + StashManager + `git_stash_*` API | 対応済み |
| FR_403_01 | FR-011（スタッシュ退避） | 対応済み |
| FR_403_02 | FR-012（スタッシュ一覧） | 対応済み |
| FR_403_03 | FR-013（スタッシュ復元） | 対応済み |
| FR_403_04 | FR-014（スタッシュ個別削除） | 対応済み |
| FR_403_05 | FR-015（スタッシュ全削除） | 対応済み |
| FR_404 | FR-016〜FR-019 + CherryPickDialog + `git_cherry_pick` API | 対応済み |
| FR_404_01 | FR-016（コミット選択） | 対応済み |
| FR_404_02 | FR-017（単一チェリーピック） | 対応済み |
| FR_404_03 | FR-018（複数チェリーピック） | 対応済み |
| FR_404_04 | FR-019（コンフリクト解決 UI 遷移） | 対応済み |
| FR_405 | FR-020〜FR-026 + ConflictResolver + `git_conflict_*` API | 対応済み |
| FR_405_01 | FR-020（コンフリクトファイル一覧） | 対応済み |
| FR_405_02 | FR-021（3ウェイマージ表示） | 対応済み |
| FR_405_03 | FR-022（ours 一括採用） | 対応済み |
| FR_405_04 | FR-023（theirs 一括採用） | 対応済み |
| FR_405_05 | FR-024（手動編集） | 対応済み |
| FR_405_06 | FR-025（解決済みマーク） | 対応済み |
| FR_405_07 | FR-026（マージ/リベース続行） | 対応済み |
| FR_406 | FR-027〜FR-030 + TagManager + `git_tag_*` API | 対応済み |
| FR_406_01 | FR-027（lightweight タグ作成） | 対応済み |
| FR_406_02 | FR-028（annotated タグ作成） | 対応済み |
| FR_406_03 | FR-029（タグ削除） | 対応済み |
| FR_406_04 | FR-030（タグ一覧） | 対応済み |
| NFR_401 | NFR-001, NFR-002 + OperationProgressBar + `git-progress` イベント | 対応済み |
| DC_401 | NFR-003, NFR-004 + DestructiveActionConfirmDialog | 対応済み |
