---
id: "design-basic-git-operations"
title: "基本 Git 操作"
type: "design"
status: "approved"
sdd-phase: "plan"
impl-status: "implemented"
created: "2026-03-25"
updated: "2026-04-11"
depends-on: ["spec-basic-git-operations"]
tags: ["git", "staging", "commit", "push", "pull", "branch", "git-cli", "tokio"]
category: "git-operations"
priority: "high"
risk: "high"
---

# 基本 Git 操作

**関連 Spec:** [basic-git-operations_spec.md](./basic-git-operations_spec.md)
**関連 PRD:** [basic-git-operations.md](../requirement/basic-git-operations.md)

---

# 1. 実装ステータス

**ステータス:** 🟢 実装完了

## 1.1. 実装進捗

| モジュール/機能 | ステータス | 備考 |
|--------------|----------|------|
| domain 型追加（CommitResult 等） | 🟢 | src/domain/ に追加済み |
| IPC 型追加（git:stage 等のチャネル） | 🟢 | src/lib/ipc.ts に追加済み |
| Tauri Core (Rust) feature（4層） | 🟢 | GitWriteRepository + UseCases + IPC Handler 実装済み |
| Webview feature（4層） | 🟢 | Repository + Service + UseCases + ViewModel 実装済み |
| Tauri invoke/listen API 拡張 | 🟢 | git.stage / git.commit 等 追加済み |
| UI コンポーネント | 🟢 | StagingArea, CommitForm, PushPullButtons, BranchOperations 実装済み |

---

# 2. 設計目標

1. **Clean Architecture 4層構成** — 既存 feature（repository-viewer, worktree-management）と同一のアーキテクチャパターンを踏襲する
2. **DI ベース設計** — VContainerConfig + Token + deps パターンで依存関係を注入する（原則 A-003）
3. **ViewModel + Hook パターン** — ViewModel は RxJS Observable でデータを公開し、Hook ラッパー経由で React に接続する
4. **既存 API との統合** — repository-viewer の読み取り API（`git_status`, `git_branches`）をリフレッシュに再利用する
5. **不可逆操作の安全性確保** — amend、ブランチ削除、hard reset の確認ダイアログを ConfirmDialog で実装する（原則 B-002）

---

# 3. 技術スタック

> 以下はプロジェクト共通の技術スタックです。機能固有の追加技術のみ記載してください。

| 領域 | 採用技術 | 選定理由 |
|------|----------|----------|
| Git 操作 | git CLI (tokio::process::Command) | Rust の tokio::process::Command 経由で git CLI を非同期実行。進捗通知は Tauri イベント経由（原則 A-002: Library-First） |

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

Tauri Core (Rust)側の application 層は UseCase + GitWriteRepository IF のみで構成する。Webviewとは異なり、状態管理 Service を持たない。Git 操作の進捗は IPC イベント（`git-progress`）経由でWebviewに通知する。

```
src-tauri/src/features/basic_git_operations/
├── application/
│   ├── repositories/
│   │   └── git_write_repository.rs          # GitWriteRepository trait
│   └── usecases/
│       ├── stage_files_usecase.rs           # StageFilesUseCase
│       ├── unstage_files_usecase.rs         # UnstageFilesUseCase
│       ├── stage_all_usecase.rs             # StageAllUseCase
│       ├── unstage_all_usecase.rs           # UnstageAllUseCase
│       ├── commit_usecase.rs                # CommitUseCase
│       ├── push_usecase.rs                  # PushUseCase
│       ├── pull_usecase.rs                  # PullUseCase
│       ├── fetch_usecase.rs                 # FetchUseCase
│       ├── create_branch_usecase.rs         # CreateBranchUseCase
│       ├── checkout_branch_usecase.rs       # CheckoutBranchUseCase
│       ├── delete_branch_usecase.rs         # DeleteBranchUseCase
│       └── reset_usecase.rs                # ResetUseCase
├── infrastructure/
│   └── repositories/
│       └── git_write_default_repository.rs  # git CLI (tokio::process::Command) による実装
├── presentation/
│   └── commands.rs                          # #[tauri::command] による IPC Handler（git:stage 等）
├── mod.rs
└── (DI は AppState + Arc<dyn Trait> で構成)
```

### Webview 側

```
src/features/basic-git-operations/
├── application/
│   ├── repositories/
│   │   └── git-operations-repository.ts     # GitOperationsRepository IF
│   ├── services/
│   │   ├── git-operations-service-interface.ts  # GitOperationsService IF
│   │   └── git-operations-service.ts            # Service 実装（BehaviorSubject で状態管理）
│   └── usecases/
│       ├── stage-files-usecase.ts           # StageFilesUseCase
│       ├── unstage-files-usecase.ts
│       ├── stage-all-usecase.ts
│       ├── unstage-all-usecase.ts
│       ├── commit-usecase.ts
│       ├── push-usecase.ts
│       ├── pull-usecase.ts
│       ├── fetch-usecase.ts
│       ├── create-branch-usecase.ts
│       ├── checkout-branch-usecase.ts
│       ├── delete-branch-usecase.ts
│       ├── get-operation-loading-usecase.ts  # ObservableStoreUseCase<boolean>
│       └── get-last-error-usecase.ts         # ObservableStoreUseCase<IPCError | null>
├── infrastructure/
│   └── repositories/
│       └── git-operations-default-repository.ts  # IPC クライアント実装
├── presentation/
│   ├── components/
│   │   ├── staging-area.tsx
│   │   ├── commit-form.tsx
│   │   ├── push-pull-buttons.tsx
│   │   └── branch-operations.tsx
│   ├── staging-viewmodel.ts
│   ├── use-staging-viewmodel.ts
│   ├── commit-viewmodel.ts
│   ├── use-commit-viewmodel.ts
│   ├── remote-ops-viewmodel.ts
│   ├── use-remote-ops-viewmodel.ts
│   ├── branch-ops-viewmodel.ts
│   └── use-branch-ops-viewmodel.ts
├── di-tokens.ts
└── di-config.ts
```

## 4.2. システム構成図

```mermaid
%%{init: {'theme': 'dark'}}%%
graph TD
    subgraph "Renderer Process"
        subgraph "presentation"
            StagingArea[StagingArea Component]
            CommitForm[CommitForm Component]
            PushPull[PushPull Buttons]
            BranchOps[Branch Operations]
            StagingVM[StagingViewModel]
            CommitVM[CommitViewModel]
            RemoteVM[RemoteOpsViewModel]
            BranchVM[BranchOpsViewModel]
        end
        subgraph "application"
            StageUC[StageFiles UseCase]
            CommitUC[Commit UseCase]
            PushUC[Push UseCase]
            GitOpsService[GitOperationsService]
            GitOpsRepoIF["GitOperationsRepository IF"]
        end
        subgraph "infrastructure"
            GitOpsRepoImpl[GitOperationsDefaultRepository]
        end
    end

    subgraph "Tauri Runtime"
        Runtime["Tauri Runtime<br/>(invoke/emit bridge)"]
    end

    subgraph "Main Process"
        subgraph "presentation (IPC)"
            IPCHandler[Git IPC Handler]
        end
        subgraph "application (main)"
            MainStageUC[StageFiles UseCase]
            MainCommitUC[Commit UseCase]
            GitWriteRepoIF["GitWriteRepository IF"]
        end
        subgraph "infrastructure (main)"
            GitWriteRepoImpl[GitWriteDefaultRepository]
            SimpleGit[git CLI (tokio::process::Command)]
        end
    end

    StagingArea --> StagingVM
    CommitForm --> CommitVM
    PushPull --> RemoteVM
    BranchOps --> BranchVM
    StagingVM --> StageUC
    CommitVM --> CommitUC
    RemoteVM --> PushUC
    StageUC --> GitOpsRepoIF
    CommitUC --> GitOpsRepoIF
    PushUC --> GitOpsRepoIF
    GitOpsRepoIF -.-> GitOpsRepoImpl
    GitOpsRepoImpl -->|"invoke"| Runtime
    Runtime -->|"invoke<T>"| IPCHandler
    IPCHandler --> MainStageUC
    IPCHandler --> MainCommitUC
    MainStageUC --> GitWriteRepoIF
    MainCommitUC --> GitWriteRepoIF
    GitWriteRepoIF -.-> GitWriteRepoImpl
    GitWriteRepoImpl --> SimpleGit
```

## 4.3. モジュール分割

| モジュール名 | プロセス | 層 | 責務 | 配置場所 |
|------------|---------|-----|------|---------|
| GitWriteRepository IF | main | application | Git 書き込み操作の抽象 | `src-tauri/src/features/basic_git_operations/application/repositories/` |
| GitWriteDefaultRepository | main | infrastructure | git CLI (tokio::process::Command) による実装 | `src-tauri/src/features/basic_git_operations/infrastructure/repositories/` |
| Git Write UseCases | main | application | 1操作1クラス（stage, commit, push等） | `src-tauri/src/features/basic_git_operations/application/usecases/` |
| Git IPC Handler | main | presentation | IPC ルーティング + バリデーション | `src-tauri/src/features/basic_git_operations/presentation/commands.rs` |
| GitOperationsRepository IF | renderer | application | Git 操作 IPC クライアントの抽象 | `src/features/basic-git-operations/application/repositories/` |
| GitOperationsDefaultRepository | renderer | infrastructure | IPC クライアント実装 | `src/features/basic-git-operations/infrastructure/repositories/` |
| GitOperationsService | renderer | application | 操作進捗・エラー状態管理（BehaviorSubject） | `src/features/basic-git-operations/application/services/` |
| Git Operations UseCases | renderer | application | 1操作1クラス | `src/features/basic-git-operations/application/usecases/` |
| ViewModels | renderer | presentation | RxJS Observable で UI 状態を公開 | `src/features/basic-git-operations/presentation/` |
| React Components | renderer | presentation | UI コンポーネント | `src/features/basic-git-operations/presentation/components/` |
| domain 型追加 | shared | domain | CommitResult, PushResult 等 | `src/domain/index.ts` |
| IPC 型追加 | shared | - | 新規チャネル定義 | `src/lib/ipc.ts` |

---

# 5. データモデル

`src/domain/index.ts` に以下の型を追加する。既存の `GitStatus`, `FileChange`, `BranchList`, `BranchInfo` 等はそのまま再利用する。

```typescript
// --- 基本 Git 操作 ---

/** コミット引数 */
export interface CommitArgs {
  worktreePath: string
  message: string
  amend?: boolean
}

/** コミット結果 */
export interface CommitResult {
  hash: string
  message: string
  author: string
  date: string // ISO 8601
}

/** プッシュ引数 */
export interface PushArgs {
  worktreePath: string
  remote?: string
  branch?: string
  setUpstream?: boolean
}

/** プッシュ結果 */
export interface PushResult {
  remote: string
  branch: string
  success: boolean
  upToDate: boolean
}

/** プル引数 */
export interface PullArgs {
  worktreePath: string
  remote?: string
  branch?: string
}

/** プル結果 */
export interface PullResult {
  remote: string
  branch: string
  summary: {
    changes: number
    insertions: number
    deletions: number
  }
  conflicts: string[]
}

/** フェッチ引数 */
export interface FetchArgs {
  worktreePath: string
  remote?: string
}

/** フェッチ結果 */
export interface FetchResult {
  remote: string
}

/** ブランチ作成引数 */
export interface BranchCreateArgs {
  worktreePath: string
  name: string
  startPoint?: string
}

/** ブランチチェックアウト引数 */
export interface BranchCheckoutArgs {
  worktreePath: string
  branch: string
}

/** ブランチ削除引数 */
export interface BranchDeleteArgs {
  worktreePath: string
  branch: string
  remote?: boolean
  force?: boolean
}

/** リセット引数 */
export interface ResetArgs {
  worktreePath: string
  commit: string   // リセット先コミットハッシュまたは参照（例: "HEAD~1"）
  mode: 'soft' | 'mixed' | 'hard'
}

/** Git 進捗イベント */
export interface GitProgressEvent {
  operation: 'push' | 'pull' | 'fetch'
  phase: string
  progress?: number // 0-100, undefined = indeterminate
}
```

---

# 6. インターフェース定義

## 6.1. Tauri Core (Rust)側

> **注記**: Tauri Core (Rust) 側の DI は `tauri::State<AppState>` + `Arc<dyn Trait>` パターンで実装。以下の TypeScript 風コード例は仕様の概要を示すものであり、実装は Rust で行われている。

### GitWriteRepository（application 層）

```typescript
// src-tauri/src/features/basic_git_operations/application/repositories/git_write_repository.rs
export interface GitWriteRepository {
  stage(worktreePath: string, files: string[]): Promise<void>
  stageAll(worktreePath: string): Promise<void>
  unstage(worktreePath: string, files: string[]): Promise<void>
  unstageAll(worktreePath: string): Promise<void>
  commit(args: CommitArgs): Promise<CommitResult>
  push(args: PushArgs): Promise<PushResult>
  pull(args: PullArgs): Promise<PullResult>
  fetch(args: FetchArgs): Promise<FetchResult>
  branchCreate(args: BranchCreateArgs): Promise<void>
  branchCheckout(args: BranchCheckoutArgs): Promise<void>
  branchDelete(args: BranchDeleteArgs): Promise<void>
}
```

### UseCase 例（application 層）

```typescript
// src-tauri/src/features/basic_git_operations/application/usecases/stage_files_usecase.rs
export class StageFilesUseCase implements ConsumerUseCase<{ worktreePath: string; files: string[] }> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: { worktreePath: string; files: string[] }): Promise<void> {
    await this.repository.stage(input.worktreePath, input.files)
  }
}
```

> **注記**: 実装では Rust の `#[tauri::command]` マクロで各コマンドを定義し、`lib.rs` の `invoke_handler!` で一括登録している。

### IPC Handler（presentation 層）

```typescript
// src-tauri/src/features/basic_git_operations/presentation/commands.rs
export function registerGitWriteIPCHandlers(
  stageFilesUseCase: StageFilesMainUseCase,
  unstageFilesUseCase: UnstageFilesMainUseCase,
  stageAllUseCase: StageAllMainUseCase,
  unstageAllUseCase: UnstageAllMainUseCase,
  commitUseCase: CommitMainUseCase,
  pushUseCase: PushMainUseCase,
  pullUseCase: PullMainUseCase,
  fetchUseCase: FetchMainUseCase,
  createBranchUseCase: CreateBranchMainUseCase,
  checkoutBranchUseCase: CheckoutBranchMainUseCase,
  deleteBranchUseCase: DeleteBranchMainUseCase,
): () => void {
  #[tauri::command]('git_stage', (_event, args) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stageFilesUseCase.invoke(args)
    }),
  )
  // ... 他のチャネルも同様
  return () => { /* removeHandler */ }
}
```

## 6.2. Webview 側

### GitOperationsRepository（application 層）

```typescript
// src/features/basic-git-operations/application/repositories/git-operations-repository.ts
export interface GitOperationsRepository {
  stage(worktreePath: string, files: string[]): Promise<void>
  stageAll(worktreePath: string): Promise<void>
  unstage(worktreePath: string, files: string[]): Promise<void>
  unstageAll(worktreePath: string): Promise<void>
  commit(args: CommitArgs): Promise<CommitResult>
  push(args: PushArgs): Promise<PushResult>
  pull(args: PullArgs): Promise<PullResult>
  fetch(args: FetchArgs): Promise<FetchResult>
  branchCreate(args: BranchCreateArgs): Promise<void>
  branchCheckout(args: BranchCheckoutArgs): Promise<void>
  branchDelete(args: BranchDeleteArgs): Promise<void>
}
```

### GitOperationsService（application 層 — ステートフル）

```typescript
// src/features/basic-git-operations/application/services/git-operations-service-interface.ts
export interface GitOperationsService extends BaseService {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>
  setLoading(loading: boolean): void
  setError(error: IPCError | null): void
  clearError(): void
}
```

### ViewModel 例

```typescript
// src/features/basic-git-operations/presentation/staging-viewmodel.ts
export interface StagingViewModel {
  /** GetOperationLoadingUseCase 経由で取得（A-004: ViewModel は UseCase のみ参照） */
  readonly loading$: Observable<boolean>
  stageFiles(worktreePath: string, files: string[]): void
  unstageFiles(worktreePath: string, files: string[]): void
  stageAll(worktreePath: string): void
  unstageAll(worktreePath: string): void
}
```

### Hook ラッパー例

```typescript
// src/features/basic-git-operations/presentation/use-staging-viewmodel.ts
export function useStagingViewModel() {
  const vm = useResolve(StagingViewModelToken)
  const loading = useObservable(vm.loading$, false)

  return {
    loading,
    stageFiles: useCallback(
      (worktreePath: string, files: string[]) => vm.stageFiles(worktreePath, files),
      [vm],
    ),
    unstageFiles: useCallback(
      (worktreePath: string, files: string[]) => vm.unstageFiles(worktreePath, files),
      [vm],
    ),
    stageAll: useCallback((worktreePath: string) => vm.stageAll(worktreePath), [vm]),
    unstageAll: useCallback((worktreePath: string) => vm.unstageAll(worktreePath), [vm]),
  }
}
```

## 6.3. DI 構成

> **注記**: Tauri Core (Rust) 側の DI は `tauri::State<AppState>` + `Arc<dyn Trait>` パターンで実装。以下の TypeScript 風コード例は仕様の概要を示すものであり、実装は Rust で行われている。

### Tauri Core (Rust)側 di-tokens.ts

```typescript
// src-tauri/src/features/basic_git_operations/di-tokens.ts (概念例)
import { createToken } from '@lib/di'

export const GitWriteRepositoryToken = createToken<GitWriteRepository>('GitWriteRepository')

// UseCase 型エイリアス
export type StageFilesMainUseCase = ConsumerUseCase<{ worktreePath: string; files: string[] }>
export const StageFilesMainUseCaseToken = createToken<StageFilesMainUseCase>('StageFilesMainUseCase')
// ... 他の UseCase Token も同様
```

### Tauri Core (Rust)側 di-config.ts

```typescript
// src-tauri/src/features/basic_git_operations/di-config.ts (概念例)
export const basicGitOperationsMainConfig: VContainerConfig = {
  register(container) {
    container.registerSingleton(GitWriteRepositoryToken, GitWriteDefaultRepository)
    container.registerSingleton(StageFilesMainUseCaseToken, StageFilesUseCase, [GitWriteRepositoryToken])
    container.registerSingleton(CommitMainUseCaseToken, CommitUseCase, [GitWriteRepositoryToken])
    // ... 他の UseCase も同様
  },
  setUp: async (container) => {
    const unregister = registerGitWriteIPCHandlers(
      container.resolve(StageFilesMainUseCaseToken),
      container.resolve(UnstageFilesMainUseCaseToken),
      // ... 他の UseCase
    )
    return () => { unregister() }
  },
}
```

### Webview 側 di-config.ts

```typescript
// src/features/basic-git-operations/di-config.ts
export const basicGitOperationsConfig: VContainerConfig = {
  register(container) {
    // Repository
    container.registerSingleton(GitOperationsRepositoryToken, GitOperationsDefaultRepository)

    // Service
    container.registerSingleton(GitOperationsServiceToken, GitOperationsDefaultService)

    // UseCases
    container.registerSingleton(StageFilesUseCaseToken, StageFilesUseCase, [
      GitOperationsRepositoryToken,
      GitOperationsServiceToken,
    ])
    // ... 他の UseCase も同様

    // Observable UseCases (Service 状態の公開用)
    container.registerSingleton(GetOperationLoadingUseCaseToken, GetOperationLoadingUseCase, [
      GitOperationsServiceToken,
    ])
    container.registerSingleton(GetLastErrorUseCaseToken, GetLastErrorUseCase, [
      GitOperationsServiceToken,
    ])

    // ViewModels (transient) — ViewModel は UseCase のみを参照し、Service を直接参照しない (A-004)
    container.registerTransient(StagingViewModelToken, StagingDefaultViewModel, [
      StageFilesUseCaseToken,
      UnstageFilesUseCaseToken,
      StageAllUseCaseToken,
      UnstageAllUseCaseToken,
      GetOperationLoadingUseCaseToken,
    ])
    container.registerTransient(CommitViewModelToken, CommitDefaultViewModel, [
      CommitUseCaseToken,
      GetOperationLoadingUseCaseToken,
    ])
    // ... 他の ViewModel も同様
  },
  setUp: async (container) => {
    const service = container.resolve(GitOperationsServiceToken)
    service.setUp()
    return () => { service.tearDown() }
  },
}
```

### DI 統合エントリーポイントへの追加

```typescript
// src-tauri/src/di/configs.ts に追加（概念例。実際は lib.rs の AppState 構築で統合）
import { basicGitOperationsMainConfig } from '../features/basic_git_operations/di-config'
export const mainConfigs = [
  // ... 既存 config
  basicGitOperationsMainConfig,
]

// src/di/configs.ts に追加
import { basicGitOperationsConfig } from '../features/basic-git-operations/di-config'
export const rendererConfigs = [
  // ... 既存 config
  basicGitOperationsConfig,
]
```

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|------|----------|
| Git 操作応答3秒以内 (NFR_301) | git CLI (tokio::process::Command) の非同期 API を使用。各操作を UseCase に分離して軽量に保つ |
| リモート操作の進捗フィードバック (NFR_302) | git CLI (tokio::process::Command) の progress イベントを `git-progress` IPC イベントでWebviewに転送 |
| 不可逆操作の安全性 (DC_301, B-002) | Shadcn/ui の AlertDialog をベースにした ConfirmDialog。destructive バリアントで視覚的に危険性を示す |
| Tauri Core (Rust)実行 (DC_302, A-001) | GitWriteRepository をTauri Core (Rust)の infrastructure 層にのみ配置。Webviewからは IPC 経由でのみアクセス |

---

# 8. テスト戦略

| テストレベル | 対象 | カバレッジ目標 |
|------------|------|------------|
| ユニットテスト | GitWriteDefaultRepository（git CLI (tokio::process::Command) をモック） | ≥ 80% |
| ユニットテスト | Tauri Core (Rust) UseCases | ≥ 80% |
| ユニットテスト | IPC Handler（バリデーション、ルーティング） | ≥ 80% |
| ユニットテスト | Webview UseCases | ≥ 80% |
| ユニットテスト | Webview ViewModel + React コンポーネント | ≥ 60% |
| 結合テスト | IPC 通信フロー（Rust Core ↔ Webview） | 主要フロー |
| 結合テスト | GitWriteDefaultRepository と実際の Git リポジトリ | 主要操作 |

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項 | 選択肢 | 決定内容 | 理由 |
|----------|--------|----------|------|
| Git ライブラリ | git CLI (tokio::process::Command) / git2 crate / tokio::process::Command 直接 | git CLI (tokio::process::Command) | CONSTITUTION A-002 で推奨。Rust の tokio::process::Command 経由で非同期実行 |
| Repository の命名 | GitService / GitWriteRepository | GitWriteRepository | ステートレスな外部 API ラッパーは「Repository」と命名する（CLAUDE.md 命名ルール） |
| 既存 read API との統合 | 別 Repository / 同一 Repository | 別 Repository（GitWriteRepository） | repository-viewer の GitReadRepository と分離。feature ごとに独立した Repository を持つ |
| ViewModel の分割 | 単一 ViewModel / 機能別分割 | 機能別分割（Staging, Commit, RemoteOps, BranchOps） | 各ドメインの関心事を分離。コンポーネントの再利用性向上 |
| 確認ダイアログ | tauri-plugin-dialog ネイティブ / React カスタム | React カスタム（Shadcn/ui AlertDialog） | UI の一貫性。操作内容に応じた詳細な情報表示が可能 |
| エラーコード体系 | フラット / ドメインプレフィックス | ドメインプレフィックス（STAGE_FAILED, NO_UPSTREAM 等） | IPC チャネルの名前空間方式に合わせた管理性 |
| ConsumerUseCase の戻り値 | `void` / `Promise<void>` | `void` | 既存パターン（worktree-management）に準拠。内部で Promise チェーンを処理する |
| IPCResult ナローイング | `!result.success` / `result.success === false` | `result.success === false` で分岐 | TypeScript の型ナローイングが正しく動作するパターン |
| GitOperationError の設計 | 汎用 Error / カスタムエラー | Tauri Core (Rust)側に `code` 付きカスタムエラーを定義 | IPC Handler で `ipcFailure(error.code, error.message)` にマッピングし、Webview 側でエラーコード別の処理を可能にする |

## 9.2. 解決済みの課題（Clarify で決定）

| 課題 | 決定内容 | 根拠 |
|------|----------|------|
| worktreePath の定義 | ワークツリーの絶対パスを指す。ワークツリー選択時に切り替わる | B-001: Worktree-First UX |
| ハンク単位ステージングのスコープ | Phase 1 ではスキップ。ファイル単位のみ実装し、Phase 2 で対応 | FR_301_03/04 は優先度「推奨」 |
| チェックアウト時の未コミット変更 | キャンセルのみ提供。stash・強制チェックアウトは提供しない | stash は Advanced Git Operations のスコープ |
| 自動リフレッシュの仕組み | 操作完了時に明示的リフレッシュ。IPC レスポンス受信後にWebview 側で既存 git:status / git:branches を呼び出す | シンプルで予測可能な方式 |

## 9.3. 未解決の課題

| 課題 | 影響度 | 対応方針 |
|------|--------|----------|
| git CLI (tokio::process::Command) の progress イベントの粒度 | 低 | リモート操作での進捗表示。実装時に確認 |
| コンフリクト発生時の UI フロー | 中 | 本機能では通知のみ。解決 UI は Advanced Git Operations |
| 大規模リポジトリでのパフォーマンス | 中 | ファイル数が多い場合の仮想スクロール等は実装時に検討 |

