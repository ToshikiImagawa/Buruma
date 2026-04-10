---
id: "design-advanced-git-operations"
title: "高度な Git 操作"
type: "design"
status: "approved"
sdd-phase: "plan"
impl-status: "implemented"
created: "2026-03-25"
updated: "2026-04-10"
depends-on: [ "spec-advanced-git-operations" ]
tags: [ "git", "merge", "rebase", "stash", "cherry-pick", "conflict", "tag", "tauri-migration"]
category: "git-operations"
priority: "medium"
risk: "high"
---

# 高度な Git 操作

**関連 Spec:** [advanced-git-operations_spec.md](./advanced-git-operations_spec.md)
**関連 PRD:** [advanced-git-operations.md](../requirement/advanced-git-operations.md)

---

# 1. 実装ステータス

**ステータス:** 🟢 実装完了

## 1.1. 実装進捗

| モジュール/機能 | ステータス | 備考 |
|---|---|---|
| domain 型追加（MergeOptions, RebaseStep, ConflictFile 等） | 🟢 | src/domain/index.ts に追加済み |
| IPC 型追加（git:merge, git:stash-save 等 24 チャネル） | 🟢 | src/lib/ipc.ts に追加済み |
| Tauri Core (Rust) feature（4層） | 🟢 | GitAdvancedRepository + 24 UseCases + IPC Handler 実装済み |
| Webview feature（4層） | 🟢 | AdvancedOperationsRepository + Service + 28 UseCases + 6 ViewModel 実装済み |
| Tauri invoke/listen API 拡張 | 🟢 | git.merge / git.rebase 等 24 メソッド追加済み |
| UI コンポーネント | 🟢 | MergeDialog, RebaseEditor, StashManager, CherryPickDialog, ConflictResolver, ThreeWayMergeView, TagManager 実装済み |

---

# 2. 設計目標

1. **Clean Architecture 4層構成** — 既存 feature（basic-git-operations, repository-viewer, worktree-management）と同一のアーキテクチャパターンを踏襲する（原則 A-004）
2. **DI ベース設計** — VContainerConfig + Token + deps パターンで依存関係を注入する（原則 A-003）
3. **ViewModel + Hook パターン** — ViewModel は RxJS Observable でデータを公開し、Hook ラッパー経由で React に接続する。ViewModel は UseCase のみ参照する（原則 A-004）
4. **不可逆操作の安全性確保** — マージ・リベース・スタッシュ全削除等の不可逆操作に確認ステップを設け、操作中は常に abort オプションを提供する（原則 B-002, DC_401）
5. **操作進捗のリアルタイムフィードバック** — 既存 `git:progress` イベントを再利用し、500ms 以内の進捗表示と30秒以内の完了通知を実現する（NFR_401）

---

# 3. 技術スタック

| 領域           | 採用技術                                 | 選定理由                                                                 |
|--------------|--------------------------------------|----------------------------------------------------------------------|
| Git 操作       | git CLI (tokio::process::Command)                           | Git コマンドの TypeScript ラッパー。マージ・リベース・スタッシュ等の高度な操作を API として提供（原則 A-002） |
| コンフリクト解決エディタ | Monaco Editor (@monaco-editor/react) | 3ウェイ差分表示、シンタックスハイライト、VS Code との親和性（原則 A-002、CONSTITUTION 推奨）         |
| ドラッグ&ドロップ    | @dnd-kit/core                        | リベースエディタでのコミット並べ替え。React 向け軽量 DnD ライブラリ                              |

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

## 4.1. ディレクトリ構成

### Tauri Core (Rust)側

Tauri Core (Rust)側の application 層は UseCase + GitAdvancedRepository IF のみで構成する。Webviewとは異なり、状態管理 Service を持たない。Git 操作の進捗は既存の IPC イベント（`git:progress`）経由でWebviewに通知する。

```
src-tauri/src/features/advanced-git-operations/
├── application/
│   ├── repositories/
│   │   └── git-advanced-repository.ts           # GitAdvancedRepository IF
│   └── usecases/
│       ├── merge-usecase.ts                     # MergeUseCase
│       ├── merge-abort-usecase.ts               # MergeAbortUseCase
│       ├── merge-status-usecase.ts              # MergeStatusUseCase
│       ├── rebase-usecase.ts                    # RebaseUseCase
│       ├── rebase-interactive-usecase.ts        # RebaseInteractiveUseCase
│       ├── rebase-abort-usecase.ts              # RebaseAbortUseCase
│       ├── rebase-continue-usecase.ts           # RebaseContinueUseCase
│       ├── get-rebase-commits-usecase.ts        # GetRebaseCommitsUseCase
│       ├── stash-save-usecase.ts                # StashSaveUseCase
│       ├── stash-list-usecase.ts                # StashListUseCase
│       ├── stash-pop-usecase.ts                 # StashPopUseCase
│       ├── stash-apply-usecase.ts               # StashApplyUseCase
│       ├── stash-drop-usecase.ts                # StashDropUseCase
│       ├── stash-clear-usecase.ts               # StashClearUseCase
│       ├── cherry-pick-usecase.ts               # CherryPickUseCase
│       ├── cherry-pick-abort-usecase.ts         # CherryPickAbortUseCase
│       ├── conflict-list-usecase.ts             # ConflictListUseCase
│       ├── conflict-file-content-usecase.ts     # ConflictFileContentUseCase
│       ├── conflict-resolve-usecase.ts          # ConflictResolveUseCase
│       ├── conflict-resolve-all-usecase.ts      # ConflictResolveAllUseCase
│       ├── conflict-mark-resolved-usecase.ts    # ConflictMarkResolvedUseCase
│       ├── tag-list-usecase.ts                  # TagListUseCase
│       ├── tag-create-usecase.ts                # TagCreateUseCase
│       └── tag-delete-usecase.ts                # TagDeleteUseCase
├── infrastructure/
│   └── repositories/
│       └── git-advanced-default-repository.ts   # git CLI (tokio::process::Command) による実装
├── presentation/
│   └── ipc-handlers.ts                          # IPC Handler（git:merge 等）
├── di-tokens.ts
└── di-config.ts
```

### Webview 側

```
src/features/advanced-git-operations/
├── application/
│   ├── repositories/
│   │   └── advanced-operations-repository.ts        # AdvancedOperationsRepository IF
│   ├── services/
│   │   ├── advanced-operations-service-interface.ts  # AdvancedOperationsService IF
│   │   └── advanced-operations-service.ts            # Service 実装（操作状態管理）
│   └── usecases/
│       ├── merge-usecase.ts                         # MergeUseCase (renderer)
│       ├── merge-abort-usecase.ts
│       ├── merge-status-usecase.ts
│       ├── rebase-usecase.ts
│       ├── rebase-interactive-usecase.ts
│       ├── rebase-abort-usecase.ts
│       ├── rebase-continue-usecase.ts
│       ├── get-rebase-commits-usecase.ts
│       ├── stash-save-usecase.ts
│       ├── stash-list-usecase.ts
│       ├── stash-pop-usecase.ts
│       ├── stash-apply-usecase.ts
│       ├── stash-drop-usecase.ts
│       ├── stash-clear-usecase.ts
│       ├── cherry-pick-usecase.ts
│       ├── cherry-pick-abort-usecase.ts
│       ├── conflict-list-usecase.ts
│       ├── conflict-file-content-usecase.ts
│       ├── conflict-resolve-usecase.ts
│       ├── conflict-resolve-all-usecase.ts
│       ├── conflict-mark-resolved-usecase.ts
│       ├── tag-list-usecase.ts
│       ├── tag-create-usecase.ts
│       ├── tag-delete-usecase.ts
│       ├── get-operation-loading-usecase.ts          # ObservableStoreUseCase<boolean>
│       ├── get-last-error-usecase.ts                 # ObservableStoreUseCase<IPCError | null>
│       ├── get-operation-progress-usecase.ts         # ObservableStoreUseCase<OperationProgress | null>
│       ├── get-current-operation-usecase.ts          # ObservableStoreUseCase<string | null>
│       └── observe-operation-completed-usecase.ts    # ObservableStoreUseCase<GitOperationCompletedEvent>
├── infrastructure/
│   └── repositories/
│       └── advanced-operations-default-repository.ts  # IPC クライアント実装
├── presentation/
│   ├── viewmodel-interfaces.ts                  # 全 ViewModel IF 定義
│   ├── components/
│   │   ├── merge-dialog.tsx
│   │   ├── rebase-editor.tsx
│   │   ├── stash-manager.tsx
│   │   ├── cherry-pick-dialog.tsx
│   │   ├── conflict-resolver.tsx
│   │   ├── three-way-merge-view.tsx
│   │   └── tag-manager.tsx
│   ├── merge-viewmodel.ts
│   ├── use-merge-viewmodel.ts
│   ├── rebase-viewmodel.ts
│   ├── use-rebase-viewmodel.ts
│   ├── stash-viewmodel.ts
│   ├── use-stash-viewmodel.ts
│   ├── cherry-pick-viewmodel.ts
│   ├── use-cherry-pick-viewmodel.ts
│   ├── conflict-viewmodel.ts
│   ├── use-conflict-viewmodel.ts
│   ├── tag-viewmodel.ts
│   └── use-tag-viewmodel.ts
├── di-tokens.ts
└── di-config.ts
```

## 4.2. システム構成図

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TD
    subgraph "Renderer Process"
        subgraph "presentation"
            MergeDialog[MergeDialog Component]
            RebaseEditor[RebaseEditor Component]
            StashManager[StashManager Component]
            CherryPickDialog[CherryPickDialog Component]
            ConflictResolver[ConflictResolver Component]
            TagManager[TagManager Component]
            MergeVM[MergeViewModel]
            RebaseVM[RebaseViewModel]
            StashVM[StashViewModel]
            CherryPickVM[CherryPickViewModel]
            ConflictVM[ConflictViewModel]
            TagVM[TagViewModel]
        end
        subgraph "application"
            MergeUC[Merge UseCase]
            RebaseUC[Rebase UseCase]
            StashUC[Stash UseCase]
            CherryPickUC[CherryPick UseCase]
            ConflictUC[Conflict UseCase]
            TagUC[Tag UseCase]
            AdvOpsService[AdvancedOperationsService]
            AdvOpsRepoIF["AdvancedOperationsRepository IF"]
        end
        subgraph "infrastructure"
            AdvOpsRepoImpl[AdvancedOperationsDefaultRepository]
        end
    end

    subgraph "Tauri Runtime"
        Runtime["Tauri Runtime<br/>(invoke/emit bridge)"]
    end

    subgraph "Main Process"
        subgraph "presentation (IPC)"
            IPCHandler[Git Advanced IPC Handler]
        end
        subgraph "application (main)"
            MainMergeUC[Merge UseCase]
            MainRebaseUC[Rebase UseCase]
            MainStashUC[Stash UseCase]
            GitAdvRepoIF["GitAdvancedRepository IF"]
        end
        subgraph "infrastructure (main)"
            GitAdvRepoImpl[GitAdvancedDefaultRepository]
            SimpleGit[git CLI (tokio::process::Command)]
        end
    end

    MergeDialog --> MergeVM
    RebaseEditor --> RebaseVM
    StashManager --> StashVM
    CherryPickDialog --> CherryPickVM
    ConflictResolver --> ConflictVM
    TagManager --> TagVM
    MergeVM --> MergeUC
    RebaseVM --> RebaseUC
    StashVM --> StashUC
    CherryPickVM --> CherryPickUC
    ConflictVM --> ConflictUC
    TagVM --> TagUC
    MergeUC --> AdvOpsRepoIF
    RebaseUC --> AdvOpsRepoIF
    StashUC --> AdvOpsRepoIF
    CherryPickUC --> AdvOpsRepoIF
    ConflictUC --> AdvOpsRepoIF
    TagUC --> AdvOpsRepoIF
    AdvOpsRepoIF -.-> AdvOpsRepoImpl
    AdvOpsRepoImpl -->|"invoke"| Bridge
    Runtime -->|"invoke<T>"| IPCHandler
    IPCHandler --> MainMergeUC
    IPCHandler --> MainRebaseUC
    IPCHandler --> MainStashUC
    MainMergeUC --> GitAdvRepoIF
    MainRebaseUC --> GitAdvRepoIF
    MainStashUC --> GitAdvRepoIF
    GitAdvRepoIF -.-> GitAdvRepoImpl
    GitAdvRepoImpl --> SimpleGit
```

## 4.3. モジュール分割

| モジュール名 | プロセス | 層 | 責務 | 配置場所 |
|---|---|---|---|---|
| GitAdvancedRepository IF | main | application | Git 高度操作の抽象（マージ・リベース・スタッシュ・チェリーピック・コンフリクト・タグ） | `src-tauri/src/features/advanced-git-operations/application/repositories/` |
| GitAdvancedDefaultRepository | main | infrastructure | git CLI (tokio::process::Command) による実装 | `src-tauri/src/features/advanced-git-operations/infrastructure/repositories/` |
| Git Advanced UseCases（24個） | main | application | 1操作1クラス（merge, rebase, stash, cherry-pick, conflict, tag） | `src-tauri/src/features/advanced-git-operations/application/usecases/` |
| Git Advanced IPC Handler | main | presentation | IPC ルーティング + バリデーション | `src-tauri/src/features/advanced-git-operations/presentation/` |
| AdvancedOperationsRepository IF | renderer | application | Git 高度操作 IPC クライアントの抽象 | `src/features/advanced-git-operations/application/repositories/` |
| AdvancedOperationsDefaultRepository | renderer | infrastructure | IPC クライアント実装 | `src/features/advanced-git-operations/infrastructure/repositories/` |
| AdvancedOperationsService | renderer | application | 操作状態管理（loading$, lastError$, operationProgress$, currentOperation$） | `src/features/advanced-git-operations/application/services/` |
| Git Advanced UseCases（~28個） | renderer | application | 1操作1クラス + Observable UseCases（24操作系 + 4 Observable） | `src/features/advanced-git-operations/application/usecases/` |
| ViewModels（6つ） | renderer | presentation | RxJS Observable で UI 状態を公開（Merge, Rebase, Stash, CherryPick, Conflict, Tag） | `src/features/advanced-git-operations/presentation/` |
| React Components（7つ） | renderer | presentation | UI コンポーネント | `src/features/advanced-git-operations/presentation/components/` |
| domain 型追加 | shared | domain | MergeOptions, RebaseStep, ConflictFile 等 | `src/domain/index.ts` |
| IPC 型追加 | shared | - | 新規 24 チャネル定義 | `src/lib/ipc.ts` |

---

# 5. データモデル

`src/domain/index.ts` に以下の型を追加する。既存の `GitStatus`, `FileChange`, `BranchList`, `CommitArgs`, `CommitResult` 等はそのまま再利用する。

```typescript
// --- 高度な Git 操作 ---

// === マージ関連 ===

/** マージオプション */
export interface MergeOptions {
  worktreePath: string
  branch: string
  strategy: 'fast-forward' | 'no-ff'
}

/** マージ結果 */
export interface MergeResult {
  status: 'success' | 'conflict' | 'already-up-to-date'
  conflictFiles?: string[]
  mergeCommit?: string
}

/** マージ状態 */
export interface MergeStatus {
  isMerging: boolean
  branch?: string
  conflictFiles?: string[]
}

// === リベース関連 ===

/** リベースオプション */
export interface RebaseOptions {
  worktreePath: string
  onto: string
}

/** インタラクティブリベースオプション */
export interface InteractiveRebaseOptions {
  worktreePath: string
  onto: string
  steps: RebaseStep[]
}

/** リベースステップ */
export interface RebaseStep {
  hash: string
  message: string
  action: RebaseAction
  order: number
}

/** リベースアクション */
export type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop'

/** リベース結果 */
export interface RebaseResult {
  status: 'success' | 'conflict' | 'aborted'
  conflictFiles?: string[]
  currentStep?: number
  totalSteps?: number
}

// === スタッシュ関連 ===

/** スタッシュ保存オプション */
export interface StashSaveOptions {
  worktreePath: string
  message?: string
  includeUntracked?: boolean
}

/** スタッシュエントリ */
export interface StashEntry {
  index: number
  message: string
  date: string // ISO 8601
  branch: string
  hash: string
}

// === チェリーピック関連 ===

/** チェリーピックオプション */
export interface CherryPickOptions {
  worktreePath: string
  commits: string[] // コミットハッシュの配列
}

/** チェリーピック結果 */
export interface CherryPickResult {
  status: 'success' | 'conflict'
  conflictFiles?: string[]
  appliedCommits: string[]
}

// === コンフリクト解決関連 ===

/** コンフリクトファイル */
export interface ConflictFile {
  filePath: string
  status: 'conflicted' | 'resolved'
  conflictType: 'content' | 'rename' | 'delete'
}

/** 3ウェイマージ内容 */
export interface ThreeWayContent {
  base: string    // 共通祖先
  ours: string    // 自分の変更
  theirs: string  // 相手の変更
  merged: string  // 現在のマージ結果（コンフリクトマーカー付き）
}

/** コンフリクト解決オプション */
export interface ConflictResolveOptions {
  worktreePath: string
  filePath: string
  resolution: ConflictResolution
}

/** コンフリクト解決方式 */
export type ConflictResolution =
  | { type: 'ours' }
  | { type: 'theirs' }
  | { type: 'manual'; content: string }

/** コンフリクト一括解決オプション */
export interface ConflictResolveAllOptions {
  worktreePath: string
  strategy: 'ours' | 'theirs'
}

// === タグ関連 ===

/** タグ情報 */
export interface TagInfo {
  name: string
  hash: string
  message?: string // annotated タグの場合のみ
  date: string // ISO 8601
  type: 'lightweight' | 'annotated'
  tagger?: string
}

/** タグ作成オプション */
export interface TagCreateOptions {
  worktreePath: string
  tagName: string
  commitHash?: string // 省略時は HEAD
  type: 'lightweight' | 'annotated'
  message?: string // annotated タグの場合に必須
}

// === 操作進捗 ===

/** 操作進捗イベント */
export interface OperationProgress {
  operationType: 'merge' | 'rebase' | 'cherry-pick'
  status: 'in-progress' | 'completed' | 'failed' | 'conflict'
  message: string
  currentStep?: number
  totalSteps?: number
}

// === 操作完了イベント ===

/** Git 操作種別 */
export type GitOperationType = 'merge' | 'rebase' | 'cherry-pick' | 'stash' | 'tag' | 'conflict-resolve' | 'reset'

/** Git 操作完了イベント（操作後のリフレッシュトリガー用） */
export interface GitOperationCompletedEvent {
  operationType: GitOperationType
  worktreePath: string
  success: boolean
}
```

---

# 6. インターフェース定義

## 6.1. Tauri Core (Rust)側

### GitAdvancedRepository（application 層）

```typescript
// src-tauri/src/features/advanced-git-operations/application/repositories/git-advanced-repository.ts
export interface GitAdvancedRepository {
  // マージ
  merge(options: MergeOptions): Promise<MergeResult>
  mergeAbort(worktreePath: string): Promise<void>
  mergeStatus(worktreePath: string): Promise<MergeStatus>
  // リベース
  rebase(options: RebaseOptions): Promise<RebaseResult>
  rebaseInteractive(options: InteractiveRebaseOptions): Promise<RebaseResult>
  rebaseAbort(worktreePath: string): Promise<void>
  rebaseContinue(worktreePath: string): Promise<RebaseResult>
  getRebaseCommits(worktreePath: string, onto: string): Promise<RebaseStep[]>
  // スタッシュ
  stashSave(options: StashSaveOptions): Promise<void>
  stashList(worktreePath: string): Promise<StashEntry[]>
  stashPop(worktreePath: string, index: number): Promise<void>
  stashApply(worktreePath: string, index: number): Promise<void>
  stashDrop(worktreePath: string, index: number): Promise<void>
  stashClear(worktreePath: string): Promise<void>
  // チェリーピック
  cherryPick(options: CherryPickOptions): Promise<CherryPickResult>
  cherryPickAbort(worktreePath: string): Promise<void>
  // コンフリクト解決
  conflictList(worktreePath: string): Promise<ConflictFile[]>
  conflictFileContent(worktreePath: string, filePath: string): Promise<ThreeWayContent>
  conflictResolve(options: ConflictResolveOptions): Promise<void>
  conflictResolveAll(options: ConflictResolveAllOptions): Promise<void>
  conflictMarkResolved(worktreePath: string, filePath: string): Promise<void>
  // タグ
  tagList(worktreePath: string): Promise<TagInfo[]>
  tagCreate(options: TagCreateOptions): Promise<void>
  tagDelete(worktreePath: string, tagName: string): Promise<void>
}
```

### UseCase 例（application 層）

```typescript
// src-tauri/src/features/advanced-git-operations/application/usecases/merge-usecase.ts
export class MergeUseCase implements FunctionUseCase<MergeOptions, Promise<MergeResult>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: MergeOptions): Promise<MergeResult> {
    return this.repository.merge(input)
  }
}
```

### IPC Handler（presentation 層）

```typescript
// src-tauri/src/features/advanced-git-operations/presentation/ipc-handlers.ts
export function registerGitAdvancedIPCHandlers(
  mergeUseCase: MergeMainUseCase,
  mergeAbortUseCase: MergeAbortMainUseCase,
  mergeStatusUseCase: MergeStatusMainUseCase,
  // ... 他の 21 UseCase
): () => void {
  #[tauri::command]('git:merge', (_event, args: MergeOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeUseCase.invoke(args)
    }),
  )

  #[tauri::command]('git:merge-abort', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeAbortUseCase.invoke(args.worktreePath)
    }),
  )

  #[tauri::command]('git:stash-save', (_event, args: StashSaveOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stashSaveUseCase.invoke(args)
    }),
  )

  // ... 他の 21 チャネルも同様

  return () => {
    // Tauri: invoke_handler からは削除不可（アプリライフタイム内は永続）
    // Tauri: invoke_handler からは削除不可（アプリライフタイム内は永続）
    // Tauri: invoke_handler からは削除不可（アプリライフタイム内は永続）
    // ... 他のチャネルも同様
  }
}
```

## 6.2. Webview 側

### AdvancedOperationsRepository（application 層）

```typescript
// src/features/advanced-git-operations/application/repositories/advanced-operations-repository.ts
export interface AdvancedOperationsRepository {
  merge(options: MergeOptions): Promise<MergeResult>
  mergeAbort(worktreePath: string): Promise<void>
  mergeStatus(worktreePath: string): Promise<MergeStatus>
  rebase(options: RebaseOptions): Promise<RebaseResult>
  rebaseInteractive(options: InteractiveRebaseOptions): Promise<RebaseResult>
  rebaseAbort(worktreePath: string): Promise<void>
  rebaseContinue(worktreePath: string): Promise<RebaseResult>
  getRebaseCommits(worktreePath: string, onto: string): Promise<RebaseStep[]>
  stashSave(options: StashSaveOptions): Promise<void>
  stashList(worktreePath: string): Promise<StashEntry[]>
  stashPop(worktreePath: string, index: number): Promise<void>
  stashApply(worktreePath: string, index: number): Promise<void>
  stashDrop(worktreePath: string, index: number): Promise<void>
  stashClear(worktreePath: string): Promise<void>
  cherryPick(options: CherryPickOptions): Promise<CherryPickResult>
  cherryPickAbort(worktreePath: string): Promise<void>
  conflictList(worktreePath: string): Promise<ConflictFile[]>
  conflictFileContent(worktreePath: string, filePath: string): Promise<ThreeWayContent>
  conflictResolve(options: ConflictResolveOptions): Promise<void>
  conflictResolveAll(options: ConflictResolveAllOptions): Promise<void>
  conflictMarkResolved(worktreePath: string, filePath: string): Promise<void>
  tagList(worktreePath: string): Promise<TagInfo[]>
  tagCreate(options: TagCreateOptions): Promise<void>
  tagDelete(worktreePath: string, tagName: string): Promise<void>
}
```

### AdvancedOperationsService（application 層 — ステートフル）

```typescript
// src/features/advanced-git-operations/application/services/advanced-operations-service-interface.ts
export interface AdvancedOperationsService extends BaseService {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>
  readonly operationProgress$: Observable<OperationProgress | null>
  readonly currentOperation$: Observable<string | null>
  readonly operationCompleted$: Observable<GitOperationCompletedEvent>
  setLoading(loading: boolean): void
  setError(error: IPCError | null): void
  clearError(): void
  setOperationProgress(progress: OperationProgress | null): void
  setCurrentOperation(operation: string | null): void
  notifyOperationCompleted(event: GitOperationCompletedEvent): void
}
```

### ViewModel インターフェース

```typescript
// src/features/advanced-git-operations/presentation/viewmodel-interfaces.ts

export interface MergeViewModel {
  readonly loading$: Observable<boolean>
  readonly mergeResult$: Observable<MergeResult | null>
  readonly mergeStatus$: Observable<MergeStatus | null>
  merge(options: MergeOptions): void
  mergeAbort(worktreePath: string): void
  getMergeStatus(worktreePath: string): void
}

export interface RebaseViewModel {
  readonly loading$: Observable<boolean>
  readonly rebaseResult$: Observable<RebaseResult | null>
  readonly rebaseCommits$: Observable<RebaseStep[]>
  rebase(options: RebaseOptions): void
  rebaseInteractive(options: InteractiveRebaseOptions): void
  rebaseAbort(worktreePath: string): void
  rebaseContinue(worktreePath: string): void
  getRebaseCommits(worktreePath: string, onto: string): void
}

export interface StashViewModel {
  readonly loading$: Observable<boolean>
  readonly stashes$: Observable<StashEntry[]>
  stashSave(options: StashSaveOptions): void
  stashList(worktreePath: string): void
  stashPop(worktreePath: string, index: number): void
  stashApply(worktreePath: string, index: number): void
  stashDrop(worktreePath: string, index: number): void
  stashClear(worktreePath: string): void
}

export interface CherryPickViewModel {
  readonly loading$: Observable<boolean>
  readonly cherryPickResult$: Observable<CherryPickResult | null>
  cherryPick(options: CherryPickOptions): void
  cherryPickAbort(worktreePath: string): void
}

export interface ConflictViewModel {
  readonly loading$: Observable<boolean>
  readonly conflictFiles$: Observable<ConflictFile[]>
  readonly threeWayContent$: Observable<ThreeWayContent | null>
  conflictList(worktreePath: string): void
  conflictFileContent(worktreePath: string, filePath: string): void
  conflictResolve(options: ConflictResolveOptions): void
  conflictResolveAll(options: ConflictResolveAllOptions): void
  conflictMarkResolved(worktreePath: string, filePath: string): void
}

export interface TagViewModel {
  readonly loading$: Observable<boolean>
  readonly tags$: Observable<TagInfo[]>
  tagList(worktreePath: string): void
  tagCreate(options: TagCreateOptions): void
  tagDelete(worktreePath: string, tagName: string): void
}
```

### Hook ラッパー例

```typescript
// src/features/advanced-git-operations/presentation/use-merge-viewmodel.ts
export function useMergeViewModel() {
  const vm = useResolve(MergeViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const mergeResult = useObservable(vm.mergeResult$, null)
  const mergeStatus = useObservable(vm.mergeStatus$, null)

  return {
    loading,
    mergeResult,
    mergeStatus,
    merge: useCallback(
      (options: MergeOptions) => vm.merge(options),
      [vm],
    ),
    mergeAbort: useCallback(
      (worktreePath: string) => vm.mergeAbort(worktreePath),
      [vm],
    ),
    getMergeStatus: useCallback(
      (worktreePath: string) => vm.getMergeStatus(worktreePath),
      [vm],
    ),
  }
}
```

## 6.3. DI 構成

### Tauri Core (Rust)側 di-tokens.ts

```typescript
// src-tauri/src/features/advanced-git-operations/di-tokens.ts
import { createToken } from '@lib/di'

export const GitAdvancedRepositoryToken = createToken<GitAdvancedRepository>('GitAdvancedRepository')

// UseCase 型エイリアス + Token（代表例）
export type MergeMainUseCase = FunctionUseCase<MergeOptions, Promise<MergeResult>>
export const MergeMainUseCaseToken = createToken<MergeMainUseCase>('MergeMainUseCase')

export type MergeAbortMainUseCase = ConsumerUseCase<string>
export const MergeAbortMainUseCaseToken = createToken<MergeAbortMainUseCase>('MergeAbortMainUseCase')

export type MergeStatusMainUseCase = FunctionUseCase<string, Promise<MergeStatus>>
export const MergeStatusMainUseCaseToken = createToken<MergeStatusMainUseCase>('MergeStatusMainUseCase')

// ... 他の 21 UseCase Token も同様
```

### Tauri Core (Rust)側 di-config.ts

```typescript
// src-tauri/src/features/advanced-git-operations/di-config.ts
export const advancedGitOperationsMainConfig: VContainerConfig = {
  register(container) {
    container.registerSingleton(GitAdvancedRepositoryToken, GitAdvancedDefaultRepository)
    container.registerSingleton(MergeMainUseCaseToken, MergeUseCase, [GitAdvancedRepositoryToken])
    container.registerSingleton(MergeAbortMainUseCaseToken, MergeAbortUseCase, [GitAdvancedRepositoryToken])
    container.registerSingleton(MergeStatusMainUseCaseToken, MergeStatusUseCase, [GitAdvancedRepositoryToken])
    // ... 他の 21 UseCase も同様
  },
  setUp: async (container) => {
    const repo = container.resolve(GitAdvancedRepositoryToken) as GitAdvancedDefaultRepository
    repo.setProgressCallback((event) => {
      const win = Tauri Window.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.app_handle.emit('git:progress', event)
      }
    })

    const unregisterHandlers = registerGitAdvancedIPCHandlers(
      container.resolve(MergeMainUseCaseToken),
      container.resolve(MergeAbortMainUseCaseToken),
      container.resolve(MergeStatusMainUseCaseToken),
      // ... 他の 21 UseCase
    )
    return () => { unregisterHandlers() }
  },
}
```

### Webview 側 di-config.ts

```typescript
// src/features/advanced-git-operations/di-config.ts
export const advancedGitOperationsConfig: VContainerConfig = {
  register(container) {
    // Repository
    container.registerSingleton(AdvancedOperationsRepositoryToken, AdvancedOperationsDefaultRepository)

    // Service
    container.registerSingleton(AdvancedOperationsServiceToken, AdvancedOperationsDefaultService)

    // UseCases（代表例）
    container.registerSingleton(MergeRendererUseCaseToken, MergeUseCase, [
      AdvancedOperationsRepositoryToken,
      AdvancedOperationsServiceToken,
    ])
    // ... 他の 23 操作系 UseCase も同様

    // Observable UseCases（Service 状態の公開用）
    container.registerSingleton(GetAdvancedOperationLoadingUseCaseToken, GetOperationLoadingUseCase, [
      AdvancedOperationsServiceToken,
    ])
    container.registerSingleton(GetAdvancedLastErrorUseCaseToken, GetLastErrorUseCase, [
      AdvancedOperationsServiceToken,
    ])
    container.registerSingleton(GetAdvancedOperationProgressUseCaseToken, GetOperationProgressUseCase, [
      AdvancedOperationsServiceToken,
    ])
    container.registerSingleton(GetAdvancedCurrentOperationUseCaseToken, GetCurrentOperationUseCase, [
      AdvancedOperationsServiceToken,
    ])

    // ViewModels (transient) — ViewModel は UseCase のみを参照し、Service を直接参照しない (A-004)
    container.registerTransient(MergeViewModelToken, MergeDefaultViewModel, [
      MergeRendererUseCaseToken,
      MergeAbortRendererUseCaseToken,
      MergeStatusRendererUseCaseToken,
      GetAdvancedOperationLoadingUseCaseToken,
    ])
    container.registerTransient(StashViewModelToken, StashDefaultViewModel, [
      StashSaveRendererUseCaseToken,
      StashListRendererUseCaseToken,
      StashPopRendererUseCaseToken,
      StashApplyRendererUseCaseToken,
      StashDropRendererUseCaseToken,
      StashClearRendererUseCaseToken,
      GetAdvancedOperationLoadingUseCaseToken,
    ])
    // ... 他の 4 ViewModel も同様
  },
  setUp: async (container) => {
    const service = container.resolve(AdvancedOperationsServiceToken)
    service.setUp()
    return () => { service.tearDown() }
  },
}
```

### DI 統合エントリーポイントへの追加

```typescript
// src-tauri/src/di/configs.ts に追加
import { advancedGitOperationsMainConfig } from '../features/advanced-git-operations/di-config'
export const mainConfigs = [
  // ... 既存 config
  advancedGitOperationsMainConfig,
]

// src/di/configs.ts に追加
import { advancedGitOperationsConfig } from '../features/advanced-git-operations/di-config'
export const rendererConfigs = [
  // ... 既存 config
  advancedGitOperationsConfig,
]
```

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|---|---|
| 進捗フィードバック 500ms 以内 (NFR_401) | git CLI (tokio::process::Command) の progress イベントを監視し、既存の `git:progress` IPC イベントでWebviewに転送。AdvancedOperationsService の `operationProgress$` で状態管理 |
| 操作完了通知 30 秒以内 (NFR_401) | 長時間操作にはタイムアウト設定。OperationProgressBar コンポーネントでリアルタイム表示 |
| 不可逆操作の確認 (DC_401, B-002) | ViewModel 内で操作前の状態チェック（`currentOperation$` で進行中操作を検出）。Webview 側で既存 ConfirmDialog（basic-git-operations の AlertDialog ベース）を再利用。特に危険な操作（stash clear, tag delete）には destructive バリアントを使用 |
| abort の常時提供 (DC_401) | マージ・リベース・チェリーピック中は OperationProgressBar + abort ボタンを常時表示。AdvancedOperationsService の `currentOperation$` で操作中状態を管理 |
| Tauri Core (Rust)実行 (A-001) | GitAdvancedRepository をTauri Core (Rust)の infrastructure 層にのみ配置。Webviewからは IPC 経由でのみアクセス |

---

# 8. テスト戦略

| テストレベル | 対象 | カバレッジ目標 |
|---|---|---|
| ユニットテスト | GitAdvancedDefaultRepository（git CLI (tokio::process::Command) をモック） | ≥ 80% |
| ユニットテスト | Tauri Core (Rust) UseCases（24 クラス） | ≥ 80% |
| ユニットテスト | IPC Handler（バリデーション、ルーティング） | ≥ 80% |
| ユニットテスト | Webview UseCases + 6 ViewModel | ≥ 60% |
| ユニットテスト | AdvancedOperationsService（状態管理ロジック） | ≥ 80% |
| 結合テスト | IPC 通信フロー（main ↔ preload ↔ renderer） | 主要フロー |
| 結合テスト | GitAdvancedDefaultRepository と実際の Git リポジトリ | 主要操作 |
| E2E テスト | マージ→コンフリクト解決→続行フロー | 主要ユースケース |
| E2E テスト | インタラクティブリベース（squash, reorder） | 主要ユースケース |
| E2E テスト | スタッシュ save→list→pop フロー | 主要ユースケース |

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項 | 選択肢 | 決定内容 | 理由 |
|---|---|---|---|
| インタラクティブリベースの実装方式 | (A) GIT_SEQUENCE_EDITOR 環境変数 / (B) git rebase --exec / (C) コミットを手動で pick | (A) GIT_SEQUENCE_EDITOR | Git 公式の仕組み。git CLI (tokio::process::Command) と組み合わせてエディタスクリプトを一時ファイルとして生成し、リベースコマンドに渡す。PRD の技術制約にも明記 |
| コンフリクト解決エディタ | (A) Monaco Editor / (B) CodeMirror / (C) カスタム差分 UI | (A) Monaco Editor | VS Code との親和性が高く、3ウェイ差分表示をネイティブサポート。CONSTITUTION で推奨技術として明記（原則 A-002） |
| 3ウェイマージの表示レイアウト | (A) 横並び3カラム / (B) 2カラム（diff + result） / (C) タブ切り替え | (A) 横並び3カラム | base / ours / theirs を同時に参照でき、マージ結果を別パネルで編集。画面幅が狭い場合はタブ切り替えにフォールバック |
| スタッシュ管理の UI 配置 | (A) 専用パネル / (B) サイドバー内 / (C) ダイアログ | (A) 専用パネル | スタッシュ一覧とプレビューを同時に表示する必要があり、ダイアログでは狭い。サイドバーの StashManager パネルとして配置 |
| 破壊的操作の確認方式 | (A) 確認ダイアログ / (B) 入力確認（タイプして確認） / (C) 2段階ボタン | (A) 確認ダイアログ | シンプルで一貫性のある UX。スタッシュ全削除、タグ削除、リベース abort 等に適用（原則 B-002） |
| コミット並べ替え UI | (A) ドラッグ&ドロップ / (B) 上下ボタン / (C) 番号入力 | (A) ドラッグ&ドロップ + (B) 上下ボタン | ドラッグ&ドロップが直感的だが、アクセシビリティのためキーボード操作（上下ボタン）も併用。@dnd-kit/core を使用 |
| Repository の命名 | GitService / GitAdvancedRepository | GitAdvancedRepository | ステートレスな外部 API ラッパーは「Repository」と命名する（CLAUDE.md 命名ルール） |
| Repository の分割粒度 | サブシステム別 Repository / 統合 Repository | 統合（GitAdvancedRepository） | basic-git-operations の GitWriteRepository と同パターン。24 メソッドを 1 Repository に統合 |
| ViewModel の分割 | 単一 ViewModel / サブシステム別分割 | サブシステム別分割（6 ViewModel） | マージ・リベース・スタッシュ・チェリーピック・コンフリクト・タグの関心事を分離 |
| 確認ダイアログ | 新規作成 / 既存 ConfirmDialog 再利用 | 既存 ConfirmDialog 再利用 | basic-git-operations で実装済みの AlertDialog ベース ConfirmDialog をそのまま使用。UI の一貫性 |
| SafetyGuard の扱い | 独立モジュール / ViewModel + Service に統合 | ViewModel + Service に統合 | 未コミット変更の検出は既存 `git:status` API、進行中操作の検出は AdvancedOperationsService の状態管理で対応 |
| 進捗通知チャネル | 既存 `git:progress` 再利用 / 新規 `git:operation-progress` | 既存 `git:progress` 再利用 | GitProgressEvent の operation フィールドで操作種別を識別可能。IPC チャネルの増加を抑制 |
| ConsumerUseCase の戻り値 | void / Promise\<void\> | void | basic-git-operations のパターンに準拠。内部で Promise チェーンを処理 |
| エラーコード体系 | フラット / ドメインプレフィックス | ドメインプレフィックス（MERGE_FAILED, REBASE_CONFLICT 等） | basic-git-operations の IPC チャネル名前空間方式に準拠 |
| Git インスタンス管理 | ワークツリーごとにインスタンス生成 / シングルトン | ワークツリーごと | GitAdvancedDefaultRepository は worktreePath をメソッド引数として受け取り、内部で git CLI (tokio::process::Command) インスタンスを生成する（B-001 準拠） |
| merge の fast-forward 対応 | `--ff` / `--ff-only` | `--ff-only` | fast-forward 不可の場合にエラーで明示的に知らせる動作。`--ff` だとサイレントに merge commit が作成される |
| 3ウェイ内容取得方式 | `git show :N:` / ファイル解析 | `git show :1:`, `:2:`, `:3:` | Git の stage number を利用した標準的な方法（base=:1, ours=:2, theirs=:3） |
| DI deps 配列の定数化 | 毎回インライン指定 / 定数化 | `REPO_AND_SERVICE` 定数で共通化 | Webview di-config で 24 UseCase に同じ `[RepositoryToken, ServiceToken]` を繰り返す冗長性を削減 |
| 3ウェイマージ UI レイアウト（実装時更新） | 横並び3カラム / タブ切り替え | Tabs（Base / Ours vs Theirs Diff / Result）+ Monaco Editor | 横並び3パネルではなくタブ切り替えで画面幅の制約に対応。DiffEditor で ours/theirs を比較表示 |

## 9.2. 解決済みの課題

| 課題 | 決定内容 | 根拠 |
|---|---|---|
| SafetyGuard の配置 | ViewModel + Service 状態管理に統合。独立モジュールは不要 | Clean Architecture の層構造に自然に統合できる |
| DestructiveActionConfirmDialog | basic-git-operations の ConfirmDialog を再利用 | UI の一貫性。新規コンポーネント作成不要 |
| OperationProgressBar の共有 | 共有コンポーネントとして実装 | マージ・リベース・チェリーピックで共通利用 |
| ConflictViewModel と MergeViewModel の連携 | 独立 ViewModel。コンポーネント層で表示切り替え | A-004 準拠。ViewModel 間の直接依存を避ける |
| git CLI (tokio::process::Command) のインタラクティブリベースサポート | git CLI (tokio::process::Command) の `.env()` + `.rebase(['-i', onto])` で実装可能 | raw コマンドへのフォールバックは不要だった |
| Monaco Editor の 3 ウェイ表示 | Tabs + Editor/DiffEditor で実現。3 パネル横並びではなくタブ切り替え | 画面幅の制約に対応しつつ、DiffEditor で ours/theirs の差分を視覚的に表示 |

## 9.3. 未解決の課題

| 課題 | 影響度 | 対応方針 |
|---|---|---|
| ~~git CLI (tokio::process::Command) のインタラクティブリベースサポート範囲~~ | ~~高~~ | 解決済み → 9.2 に移動 |
| ~~Monaco Editor の3ウェイ差分表示のカスタマイズ~~ | ~~中~~ | 解決済み → 9.2 に移動 |
| 大量コンフリクト時のパフォーマンス | 中 | コンフリクトファイルの内容は遅延ロード（ファイル選択時に取得）。一覧取得はファイルパスのみ |
| リベース中のコンフリクト解決の状態管理 | 中 | リベースの各ステップでコンフリクトが発生する可能性がある。currentStep / totalSteps をトラッキングし、ステップごとに解決→続行のフローを提供 |
| OperationProgress の domain 型設計 | 低 | OperationProgress を独自型として domain に追加するか、既存 GitProgressEvent を拡張するか。実装時に確定 |
| 外部マージツール選択 | 低 | コンフリクト解決時に外部ツール（vimdiff, meld, VS Code 等）を選択する機能は未実装。現在は Monaco Editor 固定（ours/theirs/手動編集の 3 方式）。ユーザー設定でデフォルトツールを切り替える機能は将来検討 |

---

# 10. リファクタリング計画

## 目的と背景

**リファクタリングが必要な理由:**

現在の design（v1.0）は、プロジェクトの Clean Architecture 4層構成・DI パターン・ViewModel + Hook パターンに準拠していない旧構造で記述されている。Basic Git Operations、Repository Viewer、Worktree Management はすべて Clean Architecture パターンで実装済みであり、Advanced Git Operations も同じパターンに統一する必要がある。

**ビジネス/技術的な推進要因:**

- プロジェクト全体のアーキテクチャ一貫性の確保（既存3機能との統一）
- DI パターンによるテスト容易性の向上（UseCase 単体テストが容易に）
- ViewModel + Hook パターンによるWebview 側の関心事分離

## 現状分析

**特定された問題:**

1. **ディレクトリ構造の不一致** (深刻度: 高)
    - 説明: v1.0 は `src-tauri/src/services/git/`, `src/components/git/` 等のフラットなパスを使用しているが、プロジェクトは `src/processes/{main|renderer}/features/{name}/` の feature ベース4層構成を採用済み
    - 影響: 新規開発者が既存パターンと異なる構造を見て混乱する。DI 統合エントリーポイントに接続できない

2. **命名ルール違反** (深刻度: 高)
    - 説明: `MergeService`, `RebaseService` 等のステートレスな Git CLI ラッパーに「Service」命名を使用している。CLAUDE.md の命名ルールでは、ステートレスな外部 API ラッパーは「Repository」と命名する
    - 影響: Service と Repository の責務の混同。basic-git-operations の `GitWriteRepository` パターンと不整合

3. **UseCase 層の欠如** (深刻度: 高)
    - 説明: IPC Handler から直接 Service を呼び出す設計。Clean Architecture では UseCase 層（1クラス = 1操作）を挟む
    - 影響: 操作ごとのテスト容易性低下。依存方向の違反

4. **DI パターンの欠如** (深刻度: 高)
    - 説明: `di-tokens.ts`, `di-config.ts`, VContainerConfig が未定義。DI 統合エントリーポイント（`configs.ts`）に接続できない
    - 影響: コンテナ経由のサービス解決不可。既存アプリのライフサイクルに統合できない

5. **ViewModel + Hook パターンの欠如** (深刻度: 中)
    - 説明: React コンポーネントが Props でコールバックを直接受け取る設計。プロジェクトでは ViewModel（純粋 TS + RxJS）+ Hook ラッパー（`useResolve` + `useObservable`）を使用
    - 影響: コンポーネントが UseCase を直接参照できず、A-004 準拠が困難

6. **SafetyGuard モジュールの設計見直し** (深刻度: 低)
    - 説明: 独立した `SafetyGuard` モジュールが定義されているが、Clean Architecture の層構造に位置づけられていない
    - 影響: 安全性チェックロジックの配置先が不明確

**根本原因分析:**

design v1.0 は、プロジェクトが Clean Architecture パターンを採用する前（または他 feature の実装確定前）に作成された。その後 Basic Git Operations の実装で確立されたパターン（DI + UseCase + ViewModel + Hook）が v1.0 に反映されていない。

## リファクタリング戦略

**ゴール:**

1. Clean Architecture 4層構成（application / infrastructure / presentation + domain）に準拠したディレクトリ構成へ更新
2. DI パターン（VContainerConfig + Token + useClass + deps）を適用
3. ViewModel + Hook パターンを適用（ViewModel は UseCase のみ参照、A-004 準拠）
4. ステートレスな Git CLI ラッパーを「Repository」に命名統一
5. 1クラス = 1操作の UseCase 層を導入

**アプローチ:**

- **パターン:** Basic Git Operations で確立済みのパターンをそのまま踏襲
- **技法:** design doc セクション 1〜9 を v2.0 として全面更新。PRD・spec は変更なし（論理仕様は正しいため）

**トレードオフ:**

| 側面 | Before (v1.0) | After (v2.0) | トレードオフ |
|:---|:---|:---|:---|
| ファイル数 | 少ない（フラット構成） | 多い（feature ベース4層） | ファイル数は増えるが各ファイルの責務が明確 |
| 学習コスト | 低い（直接的な構成） | 中程度（Clean Architecture の理解が必要） | プロジェクト全体で統一されているため、他 feature と同じパターンで学習可能 |
| テスト容易性 | 低い（密結合） | 高い（DI + UseCase 単体テスト） | テストコードは増えるが品質が向上 |

## 移行計画

design doc の各セクションを以下の方針で v2.0 に更新する:

**セクション 1（実装ステータス）:**

- モジュール名を Clean Architecture 命名に更新
  - `MergeService` → `MergeRepository IF` + `MergeDefaultRepository` + `Merge UseCases`
  - `SafetyGuard` → 削除（安全性チェックは UseCase 内の前処理として実装、または共有ユーティリティとして `src/lib/` に配置）
  - `MergeDialog` → `MergeViewModel` + `useMergeViewModel` + `MergeDialog`

**セクション 4（アーキテクチャ）:**

- ディレクトリ構成を feature ベース4層に更新:

```
src-tauri/src/features/advanced-git-operations/
├── application/
│   ├── repositories/
│   │   └── git-advanced-repository.ts       # GitAdvancedRepository IF（全6サブシステム統合）
│   └── usecases/
│       ├── merge-usecase.ts                 # MergeUseCase
│       ├── merge-abort-usecase.ts           # MergeAbortUseCase
│       ├── merge-status-usecase.ts          # MergeStatusUseCase
│       ├── rebase-usecase.ts                # RebaseUseCase
│       ├── rebase-interactive-usecase.ts    # RebaseInteractiveUseCase
│       ├── rebase-abort-usecase.ts          # RebaseAbortUseCase
│       ├── rebase-continue-usecase.ts       # RebaseContinueUseCase
│       ├── get-rebase-commits-usecase.ts    # GetRebaseCommitsUseCase
│       ├── stash-save-usecase.ts            # StashSaveUseCase
│       ├── stash-list-usecase.ts            # StashListUseCase
│       ├── stash-pop-usecase.ts             # StashPopUseCase
│       ├── stash-apply-usecase.ts           # StashApplyUseCase
│       ├── stash-drop-usecase.ts            # StashDropUseCase
│       ├── stash-clear-usecase.ts           # StashClearUseCase
│       ├── cherry-pick-usecase.ts           # CherryPickUseCase
│       ├── cherry-pick-abort-usecase.ts     # CherryPickAbortUseCase
│       ├── conflict-list-usecase.ts         # ConflictListUseCase
│       ├── conflict-file-content-usecase.ts # ConflictFileContentUseCase
│       ├── conflict-resolve-usecase.ts      # ConflictResolveUseCase
│       ├── conflict-resolve-all-usecase.ts  # ConflictResolveAllUseCase
│       ├── conflict-mark-resolved-usecase.ts # ConflictMarkResolvedUseCase
│       ├── tag-list-usecase.ts              # TagListUseCase
│       ├── tag-create-usecase.ts            # TagCreateUseCase
│       └── tag-delete-usecase.ts            # TagDeleteUseCase
├── infrastructure/
│   └── repositories/
│       └── git-advanced-default-repository.ts  # git CLI (tokio::process::Command) による実装
├── presentation/
│   └── ipc-handlers.ts                     # IPC Handler（git:merge 等）
├── di-tokens.ts
└── di-config.ts
```

```
src/features/advanced-git-operations/
├── application/
│   ├── repositories/
│   │   └── advanced-operations-repository.ts     # AdvancedOperationsRepository IF
│   ├── services/
│   │   ├── advanced-operations-service-interface.ts  # AdvancedOperationsService IF
│   │   └── advanced-operations-service.ts            # Service 実装（操作状態管理）
│   └── usecases/
│       ├── merge-usecase.ts                 # MergeUseCase (renderer)
│       ├── merge-abort-usecase.ts
│       ├── ... (Tauri Core (Rust)側と対応する全 UseCase)
│       ├── get-operation-loading-usecase.ts  # ObservableStoreUseCase<boolean>
│       └── get-last-error-usecase.ts         # ObservableStoreUseCase<IPCError | null>
├── infrastructure/
│   └── repositories/
│       └── advanced-operations-default-repository.ts  # IPC クライアント実装
├── presentation/
│   ├── viewmodel-interfaces.ts              # 全 ViewModel IF
│   ├── components/
│   │   ├── merge-dialog.tsx
│   │   ├── rebase-editor.tsx
│   │   ├── stash-manager.tsx
│   │   ├── cherry-pick-dialog.tsx
│   │   ├── conflict-resolver.tsx
│   │   ├── three-way-merge-view.tsx
│   │   └── tag-manager.tsx
│   ├── merge-viewmodel.ts
│   ├── use-merge-viewmodel.ts
│   ├── rebase-viewmodel.ts
│   ├── use-rebase-viewmodel.ts
│   ├── stash-viewmodel.ts
│   ├── use-stash-viewmodel.ts
│   ├── cherry-pick-viewmodel.ts
│   ├── use-cherry-pick-viewmodel.ts
│   ├── conflict-viewmodel.ts
│   ├── use-conflict-viewmodel.ts
│   ├── tag-viewmodel.ts
│   └── use-tag-viewmodel.ts
├── di-tokens.ts
└── di-config.ts
```

- システム構成図を Clean Architecture 層構成に更新
- モジュール分割テーブルを4層構成に更新

**セクション 4.2（モジュール分割）:**

| モジュール名 | プロセス | 層 | 責務 | 配置場所 |
|---|---|---|---|---|
| GitAdvancedRepository IF | main | application | Git 高度操作の抽象（マージ・リベース・スタッシュ・チェリーピック・コンフリクト・タグ） | `features/advanced-git-operations/application/repositories/` |
| GitAdvancedDefaultRepository | main | infrastructure | git CLI (tokio::process::Command) による実装 | `features/advanced-git-operations/infrastructure/repositories/` |
| Git Advanced UseCases | main | application | 1操作1クラス（24 UseCases） | `features/advanced-git-operations/application/usecases/` |
| Git Advanced IPC Handler | main | presentation | IPC ルーティング + バリデーション | `features/advanced-git-operations/presentation/` |
| AdvancedOperationsRepository IF | renderer | application | Git 高度操作 IPC クライアントの抽象 | `features/advanced-git-operations/application/repositories/` |
| AdvancedOperationsDefaultRepository | renderer | infrastructure | IPC クライアント実装 | `features/advanced-git-operations/infrastructure/repositories/` |
| AdvancedOperationsService | renderer | application | 操作状態管理（loading$, lastError$, operationProgress$） | `features/advanced-git-operations/application/services/` |
| Git Advanced UseCases | renderer | application | 1操作1クラス + Observable UseCases | `features/advanced-git-operations/application/usecases/` |
| ViewModels | renderer | presentation | RxJS Observable で UI 状態を公開（6 ViewModel） | `features/advanced-git-operations/presentation/` |
| React Components | renderer | presentation | UI コンポーネント | `features/advanced-git-operations/presentation/components/` |

**セクション 5（データモデル）:**

- 型定義を `src/domain/index.ts` に追加する方針に更新（`src/types/git-advanced.ts` ではなく）
- 既存の `IPCChannelMap` / `IPCEventMap` に新チャネルを追加

**セクション 6（インターフェース定義）:**

- IPC Handler を `wrapHandler` + `validatePath` パターンに更新
- Service を直接呼び出すのではなく UseCase 経由に変更
- Tauri invoke/listen API は `src/lib/ipc.ts` の `ElectronAPI.git` に型安全に追加
- ViewModel + Hook パターンのインターフェース定義を追加

**セクション 6.3（DI 構成）:**

- Tauri Core (Rust)側 `di-tokens.ts` と `di-config.ts` を追加
- Webview 側 `di-tokens.ts` と `di-config.ts` を追加
- `src-tauri/src/di/configs.ts` と `src/di/configs.ts` への1行追加

**SafetyGuard の扱い:**

`SafetyGuard` は独立モジュールとして設計されていたが、以下のように再配置する:

- 未コミット変更の検出 → 既存の `git:status` API を利用（Webview 側 ViewModel で判定）
- 進行中の操作検出 → `AdvancedOperationsService` の状態管理で対応
- 独立モジュールとしての `SafetyGuard` は削除し、各 ViewModel 内のロジックとして統合

## 影響分析

**破壊的変更:**

- [x] なし（後方互換性あり） — 未実装機能のため影響なし

**影響を受けるコンポーネント:**

| コンポーネント | タイプ | 影響 | 緩和策 |
|:---|:---|:---|:---|
| `src/domain/index.ts` | 共有型 | 高度な Git 操作の型追加 | 既存型との名前衝突なし |
| `src/lib/ipc.ts` | IPC 定義 | 新チャネル追加 | 既存チャネルに影響なし |
| （preload 層は Tauri では不要） | Preload | git API 拡張 | 既存メソッドに影響なし |
| `src-tauri/src/di/configs.ts` | DI 統合 | 1行追加 | 追加のみ |
| `src/di/configs.ts` | DI 統合 | 1行追加 | 追加のみ |

**依存関係:**

- 必要: basic-git-operations の `GitProgressEvent` / `git:progress` IPC イベント（進捗通知の共通基盤として再利用）
- 必要: repository-viewer の `git:status` / `git:branches`（操作後のリフレッシュ用）

## テスト戦略

| テストレベル | 対象 | カバレッジ目標 |
|---|---|---|
| ユニットテスト | GitAdvancedDefaultRepository（git CLI (tokio::process::Command) をモック） | ≥ 80% |
| ユニットテスト | Tauri Core (Rust) UseCases（24 クラス） | ≥ 80% |
| ユニットテスト | IPC Handler（バリデーション、ルーティング） | ≥ 80% |
| ユニットテスト | Webview UseCases + 6 ViewModel | ≥ 60% |
| 結合テスト | IPC 通信フロー（main ↔ preload ↔ renderer） | 主要フロー |
| E2E テスト | マージ→コンフリクト解決→続行フロー | 主要ユースケース |
| E2E テスト | スタッシュ save→list→pop フロー | 主要ユースケース |

## 成功基準

- [ ] design doc の全セクションが Clean Architecture パターンに準拠
- [ ] `npm run typecheck` がパス
- [ ] `npm run lint` がパス
- [ ] `npm run test` がパス
- [ ] 既存 feature（basic-git-operations, repository-viewer, worktree-management）に影響なし

## リスクと緩和策

| リスク | 可能性 | 影響 | 緩和策 |
|:---|:---|:---|:---|
| UseCase 数の多さ（24 クラス）による実装工数増大 | 高 | 中 | サブシステム別にフェーズ分割（マージ→スタッシュ→コンフリクト→リベース→チェリーピック→タグ） |
| インタラクティブリベースの git CLI (tokio::process::Command) サポート不足 | 中 | 高 | git CLI (tokio::process::Command) の raw コマンド実行で対応。不足時は tokio::process::Command にフォールバック |
| Monaco Editor の3ウェイ表示カスタマイズ | 中 | 中 | DiffEditor 2つ + 結果エディタの3パネル構成。サードパーティライブラリも検討 |

## 参考資料

- 関連 PRD: [advanced-git-operations.md](../requirement/advanced-git-operations.md)
- 関連仕様書: [advanced-git-operations_spec.md](./advanced-git-operations_spec.md)
- 参考実装: [basic-git-operations_design.md](./basic-git-operations_design.md) — Clean Architecture パターンの実装済みリファレンス

---

**最終更新:** 2026-04-04
**作成者:** Claude Code (AI-SDD plan-refactor スキル)

---

# 11. 変更履歴

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

> 本 Design Doc の本文中のコード例・アーキテクチャ記述は Phase I の実装移行（IA〜IH）を通じて段階的に Tauri 版に最終化される。現時点では一部に旧 Electron 版の表現が歴史的記録として残る可能性がある。

---

## v2.0 (2026-04-04)

**変更内容:**

- セクション 1〜9 を Clean Architecture 4層構成パターンに全面更新
- DI パターン（VContainerConfig + Token + useClass + deps）のインターフェース定義を追加
- ViewModel + Hook パターンの 6 ViewModel インターフェース定義を追加
- `MergeService` 等の旧命名を `GitAdvancedRepository` に統一
- `SafetyGuard` を ViewModel + Service 状態管理に統合
- `src/types/git-advanced.ts` → `src/domain/index.ts` にデータモデル配置先を修正
- 進捗通知を既存 `git:progress` イベントの再利用方針に決定
- ConfirmDialog を basic-git-operations の既存コンポーネントとして再利用する方針に決定
- リファクタリング計画をセクション 10 に追加

## v1.0 (2026-03-25)

**変更内容:**

- 初版作成
- マージ、リベース、スタッシュ、チェリーピック、コンフリクト解決、タグ管理の設計を定義
- SafetyGuard モジュールによる安全性チェックの設計を追加
- Monaco Editor を用いた3ウェイマージ UI の設計を定義
