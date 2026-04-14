---
id: "design-worktree-management"
title: "ワークツリー管理"
type: "design"
status: "approved"
sdd-phase: "plan"
impl-status: "in-progress"
created: "2026-03-25"
updated: "2026-04-11"
depends-on: ["spec-worktree-management"]
tags: ["worktree", "core", "ui", "tauri-migration"]
category: "core"
priority: "critical"
risk: "high"
---

# ワークツリー管理

**関連 Spec:** [worktree-management_spec.md](./worktree-management_spec.md)
**関連 PRD:** [worktree-management.md](../requirement/worktree-management.md)

---

# 1. 実装ステータス

**ステータス:** 🟡 一部実装済み（v0.1.0 基盤完了、FR_102_05 / FR_103_05 / FR_106 は未実装）

## 1.1. 実装進捗

| モジュール | プロセス | 層 | ステータス | 備考 |
|-----------|---------|-----|----------|------|
| ListWorktreesMainUseCase | main | application | 🟢 | ワークツリー一覧取得 + dirty 並列チェック |
| GetWorktreeStatusMainUseCase | main | application | 🟢 | ワークツリーステータス取得 |
| CreateWorktreeMainUseCase | main | application | 🟢 | ワークツリー作成 |
| DeleteWorktreeMainUseCase | main | application | 🟢 | ワークツリー削除（メイン WT 保護付き） |
| SuggestPathMainUseCase | main | application | 🟢 | パス提案（メイン WT パス解決） |
| CheckDirtyMainUseCase | main | application | 🟢 | dirty チェック |
| GetDefaultBranchMainUseCase | main | application | 🟢 | デフォルトブランチ検出 |
| WorktreeGitDefaultRepository | main | infrastructure | 🟢 | git CLI (tokio::process::Command) ラッパー |
| WorktreeWatcher | main | infrastructure | 🟢 | notify + notify-debouncer-full ファイルシステム監視 |
| IPC Handlers (worktree:*) | main | presentation | 🟢 | IPC チャネル登録・ルーティング |
| DI 設定 (main) | main | — | 🟢 | di-tokens.ts / di-config.ts |
| WorktreeService | renderer | application | 🟢 | BehaviorSubject 状態管理 |
| UseCases | renderer | application | 🟢 | List, Create, Delete, Select 等（9実装） |
| WorktreeDefaultRepository | renderer | infrastructure | 🟢 | IPC クライアント |
| ViewModels | renderer | presentation | 🟢 | WorktreeList / Detail ViewModel |
| React Components | renderer | presentation | 🟢 | WorktreeList, Detail, Dialogs（5コンポーネント） |
| DI 設定 (renderer) | renderer | — | 🟢 | di-tokens.ts / di-config.ts |
| Worktree domain types | shared | domain | 🟢 | WorktreeInfo, WorktreeStatus 等 |
| IPC 型拡張 | shared | types | 🟢 | IPCChannelMap 拡張 |
| BranchCombobox 共通コンポーネント | renderer | presentation (共有) | 🟢 | FR_102_05: `src/components/branch-combobox.tsx`（FR_712 design と共有） |
| WorktreeCreateDialog ブランチ選択UI | renderer | presentation | 🟢 | FR_102_05: BranchCombobox 統合、ブランチ一覧取得、invokeCommand 排除 |
| DeleteWorktreeMainUseCase 拡張 | main | application | 🔴 | FR_103_05: ブランチ同時削除ロジック追加 |
| WorktreeDeleteDialog ブランチ削除UI | renderer | presentation | 🔴 | FR_103_05: チェックボックス追加、他WT使用中判定 |
| SymlinkService | main | application | 🟢 | FR_106: 設定読み込み + glob マッチ + symlink 作成 |
| SymlinkConfigRepository | main | infrastructure | 🟢 | FR_106: `.buruma/symlink.json` + tauri-plugin-store |
| SymlinkFileRepository | main | infrastructure | 🟢 | FR_106: クロスプラットフォーム symlink 作成 |
| CreateWorktreeMainUseCase 拡張 | main | application | 🟢 | FR_106: symlink 自動作成統合、WorktreeCreateResult 返却 |
| IPC Handlers (symlink config) | main | presentation | 🟢 | FR_106: `worktree_symlink_config_get/set` |
| Settings シンボリックリンクセクション | renderer | presentation | 🟢 | FR_106: 設定管理UI（SettingsDialog スロット方式、A-004 準拠） |

---

# 2. 設計目標

1. **Worktree-First UX** — ワークツリーを UI の主軸に据え、左パネル一覧 + 右パネル詳細の2カラムレイアウトを実現する（原則 B-001）
2. **安全な Git 操作** — 不可逆操作（削除）には確認ステップを設け、メインワークツリーの削除を防止する（原則 B-002）
3. **Tauri プロセス分離** — すべての Git 操作をTauri Core (Rust)で実行し、型安全な invoke/listen ラッパー 経由でWebviewに API を公開する（原則 A-001, T-003）
4. **型安全な IPC 通信** — `IPCResult<T>` パターンですべてのレスポンスを統一し、コンパイル時にエラーを検出する（原則 T-001, T-002）
5. **リアルタイム状態反映** — ファイルシステム監視によりワークツリーの状態変化を自動検出・UI 反映する

---

# 3. 技術スタック

> 以下はプロジェクト共通の技術スタックです。機能固有の追加技術のみ記載してください。

| 領域 | 採用技術 | 選定理由 |
|------|----------|----------|
| Git 操作 | git CLI (tokio::process::Command) | Git CLI のラッパー。`worktree list --porcelain` のパース、`worktree add/remove` の実行に使用。メンテナンスが活発で API が直感的（原則 A-002: Library-First） |
| ファイルシステム監視 | notify + notify-debouncer-full | Node.js のクロスプラットフォームファイル監視。macOS FSEvents / Linux inotify / Windows ReadDirectoryChangesW を抽象化。デバウンス機能内蔵（原則 A-002） |
| ダイアログ UI | Shadcn/ui Dialog | Shadcn/ui が提供するアクセシブルなダイアログコンポーネント。Tailwind CSS との統合が良好 |
| glob マッチング | `glob` crate | Rust 標準的な glob パターンマッチング。シンボリックリンク対象ファイルの検索に使用（A-002: Library-First） |
| ブランチ選択 | shadcn/ui Combobox (`@radix-ui/react-popover` + `cmdk`) | BranchCombobox 共通コンポーネント。ローカル/リモートブランチのグループ表示とフィルタリング |

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
        subgraph "Presentation 層"
            Components["React Components<br/>(WorktreeList, Detail, Dialogs)"]
            VMs["ViewModels<br/>(WorktreeListVM, DetailVM)"]
            Hooks["Hook ラッパー<br/>(useWorktreeListVM, useWorktreeDetailVM)"]
            Components --> Hooks
            Hooks --> VMs
        end
        subgraph "Application 層 (Renderer)"
            RUCs["UseCases<br/>(List, Create, Delete, Select, Refresh)"]
            RService["WorktreeService<br/>(BehaviorSubject 状態管理)"]
            RRepoIF["WorktreeRepository IF"]
            VMs --> RUCs
            RUCs --> RService
            RUCs --> RRepoIF
        end
        subgraph "Infrastructure 層 (Renderer)"
            RRepoDefault["WorktreeDefaultRepository<br/>(IPC クライアント)"]
            RRepoIF -.->|"実装"| RRepoDefault
        end
    end

    subgraph "Tauri Runtime"
        Runtime["Tauri Runtime<br/>(invoke/emit bridge)"]
    end

    subgraph "Main Process"
        subgraph "Presentation 層 (Main)"
            IPCHandlers["IPC Handlers<br/>(wrapHandler + #[tauri::command])"]
        end
        subgraph "Application 層 (Main)"
            MUC["UseCases<br/>(List, Status, Create, Delete,<br/>SuggestPath, CheckDirty, DefaultBranch)"]
            MGitIF["WorktreeGitRepository IF"]
            MWatcherIF["WorktreeWatcher IF"]
            IPCHandlers --> MUC
            MUC --> MGitIF
        end
        subgraph "Infrastructure 層 (Main)"
            MGitDefault["WorktreeGitDefaultRepository<br/>(git CLI (tokio::process::Command))"]
            MWatcher["WorktreeWatcher<br/>(notify + notify-debouncer-full)"]
            MGitIF -.->|"実装"| MGitDefault
            MWatcherIF -.->|"実装"| MWatcher
        end
    end

    subgraph "External"
        Git[Git CLI]
        FS[ファイルシステム]
    end

    RRepoDefault -->|"invoke"| Bridge
    Runtime -->|"invoke<T>"| IPCHandlers
    IPCHandlers -->|"IPCResult"| Bridge
    Runtime -->|"result"| RRepoDefault
    MWatcher -->|"app_handle.emit"| Bridge
    Runtime -->|"onChanged"| RRepoDefault
    MGitDefault -->|"git worktree"| Git
    MWatcher -->|"notify + notify-debouncer-full watch"| FS
```

## 4.2. モジュール分割

### Tauri Core (Rust)側

| モジュール名 | 層 | 責務 | 配置場所 |
|------------|-----|------|---------|
| ListWorktreesMainUseCase | application | FunctionUseCase を継承、ワークツリー一覧取得 + dirty 並列チェック | `src-tauri/src/features/worktree_management/application/usecases/list_worktrees_main_usecase.rs` |
| GetWorktreeStatusMainUseCase | application | FunctionUseCase を継承、ワークツリーステータス取得 | `src-tauri/src/features/worktree_management/application/usecases/get_worktree_status_main_usecase.rs` |
| CreateWorktreeMainUseCase | application | FunctionUseCase を継承、ワークツリー作成 | `src-tauri/src/features/worktree_management/application/usecases/create_worktree_main_usecase.rs` |
| DeleteWorktreeMainUseCase | application | FunctionUseCase を継承、ワークツリー削除（メイン WT 保護付き） | `src-tauri/src/features/worktree_management/application/usecases/delete_worktree_main_usecase.rs` |
| SuggestPathMainUseCase | application | FunctionUseCase を継承、パス提案（メイン WT パス解決） | `src-tauri/src/features/worktree_management/application/usecases/suggest_path_main_usecase.rs` |
| CheckDirtyMainUseCase | application | FunctionUseCase を継承、dirty チェック | `src-tauri/src/features/worktree_management/application/usecases/check_dirty_main_usecase.rs` |
| GetDefaultBranchMainUseCase | application | FunctionUseCase を継承、デフォルトブランチ検出 | `src-tauri/src/features/worktree_management/application/usecases/get_default_branch_main_usecase.rs` |
| WorktreeGitRepository IF | application | Git 操作の抽象インターフェース（Rust trait） | `src-tauri/src/features/worktree_management/application/worktree_interfaces.rs` |
| WorktreeWatcher IF | application | ファイル監視の抽象インターフェース（Rust trait） | `src-tauri/src/features/worktree_management/application/worktree_interfaces.rs` |
| WorktreeGitDefaultRepository | infrastructure | git CLI (tokio::process::Command) ラッパー（list, add, remove, status） | `src-tauri/src/features/worktree_management/infrastructure/worktree_git_service.rs` |
| WorktreeWatcher | infrastructure | notify + notify-debouncer-full による `.git/worktrees` 監視 | `src-tauri/src/features/worktree_management/infrastructure/worktree_watcher.rs` |
| IPC Handlers | presentation | worktree:* チャネル登録、`#[tauri::command]` パターン | `src-tauri/src/features/worktree_management/presentation/commands.rs` |
| SymlinkService | application | FR_106: 設定読み込み + glob マッチ判定のオーケストレーション（実際の symlink 作成は SymlinkFileRepository IF 経由で infrastructure 層に委譲） | `src-tauri/src/features/worktree_management/application/symlink_service.rs` |
| SymlinkConfigRepository IF | application | FR_106: シンボリックリンク設定の読み書きインターフェース（Rust trait） | `src-tauri/src/features/worktree_management/application/symlink_interfaces.rs` |
| SymlinkConfigDefaultRepository | infrastructure | FR_106: `.buruma/symlink.json` 読み込み + `tauri-plugin-store` fallback | `src-tauri/src/features/worktree_management/infrastructure/symlink_config_repository.rs` |
| SymlinkFileRepository IF | application | FR_106: symlink 作成操作のインターフェース（Rust trait） | `src-tauri/src/features/worktree_management/application/symlink_interfaces.rs` |
| SymlinkFileDefaultRepository | infrastructure | FR_106: `std::os::unix::fs::symlink` / `std::os::windows::fs::symlink_dir` による実装 | `src-tauri/src/features/worktree_management/infrastructure/symlink_file_repository.rs` |
| DI / State (main) | — | AppState + Arc&lt;dyn Trait&gt; で依存注入 | `src-tauri/src/features/worktree_management/mod.rs` |

### Webview 側

| モジュール名 | 層 | 責務 | 配置場所 |
|------------|-----|------|---------|
| WorktreeService | application | BehaviorSubject による状態管理（worktrees$, selectedPath$） | `src/features/worktree-management/application/worktree-service.ts` |
| WorktreeRepository IF | application | IPC クライアントの抽象インターフェース | `src/features/worktree-management/di-tokens.ts` |
| UseCases | application | List, Create, Delete, Select, Refresh, SuggestPath, CheckDirty | `src/features/worktree-management/application/usecases/*.ts` |
| WorktreeDefaultRepository | infrastructure | invokeCommand / listenEvent ラッパー.worktree 経由の IPC クライアント | `src/features/worktree-management/infrastructure/worktree-default-repository.ts` |
| WorktreeListViewModel | presentation | 一覧画面の ViewModel（UseCase 経由で Observable 公開） | `src/features/worktree-management/presentation/worktree-list-viewmodel.ts` |
| WorktreeDetailViewModel | presentation | 詳細パネルの ViewModel | `src/features/worktree-management/presentation/worktree-detail-viewmodel.ts` |
| useWorktreeListViewModel | presentation | Hook ラッパー（useResolve + useObservable） | `src/features/worktree-management/presentation/use-worktree-list-viewmodel.ts` |
| useWorktreeDetailViewModel | presentation | Hook ラッパー | `src/features/worktree-management/presentation/use-worktree-detail-viewmodel.ts` |
| React Components | presentation | WorktreeList, WorktreeListItem, WorktreeDetail, Dialogs | `src/features/worktree-management/presentation/components/*.tsx` |
| BranchCombobox | presentation (共有) | FR_102_05/FR_712: ブランチ選択 Combobox 共通コンポーネント | `src/components/branch-combobox.tsx` |
| DI Tokens (renderer) | — | createToken 定義、Repository/Service/UseCase/ViewModel IF | `src/features/worktree-management/di-tokens.ts` |
| DI Config (renderer) | — | VContainerConfig { register, setUp } | `src/features/worktree-management/di-config.ts` |

### 共有

| モジュール名 | 責務 | 配置場所 |
|------------|------|---------|
| Worktree domain types | WorktreeInfo, WorktreeStatus 等の純粋な型定義 | `src/domain/index.ts` に追加 |
| IPC 型拡張 | IPCChannelMap, IPCEventMap への worktree 名前空間追加 | `src/lib/ipc.ts` に追加 |
| Tauri invoke/listen API (worktree) | 型安全な worktree API | `@tauri-apps/api` の invoke/listen を直接使用（preload 層は Tauri では不要） |
| Symlink domain types | FR_106: SymlinkConfig, SymlinkResult, SymlinkResultEntry, WorktreeCreateResult | `src/domain/index.ts` に追加 |
| BranchDeleteResult domain type | FR_103_05: ブランチ削除結果型 | `src/domain/index.ts` に追加 |

## 4.3. DI 設計

> **注記**: Tauri Core (Rust) 側の DI は `tauri::State<AppState>` + `Arc<dyn Trait>` パターンで実装。以下の TypeScript 風コード例は仕様の概要を示すものであり、実装は Rust で行われている。

### Tauri Core (Rust)側 DI Tokens

```typescript
// src-tauri/src/features/worktree_management/di-tokens.ts (概念例)
import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeInfo, WorktreeStatus } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository, WorktreeWatcher } from './application/worktree-interfaces'
import { createToken } from '@lib/di'

// Infrastructure IF
export const WorktreeGitDefaultRepositoryToken = createToken<WorktreeGitRepository>('WorktreeGitDefaultRepository')
export const WorktreeWatcherToken = createToken<WorktreeWatcher>('WorktreeWatcher')

// Application UseCase 型
export type ListWorktreesMainUseCase = FunctionUseCase<string, Promise<WorktreeInfo[]>>
export type GetWorktreeStatusMainUseCase = FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
>
export type CreateWorktreeMainUseCase = FunctionUseCase<WorktreeCreateParams, Promise<WorktreeInfo>>
export type DeleteWorktreeMainUseCase = FunctionUseCase<WorktreeDeleteParams, Promise<void>>
export type SuggestPathMainUseCase = FunctionUseCase<{ repoPath: string; branch: string }, Promise<string>>
export type CheckDirtyMainUseCase = FunctionUseCase<string, Promise<boolean>>
export type GetDefaultBranchMainUseCase = FunctionUseCase<string, Promise<string>>

// Application UseCase Tokens
export const ListWorktreesMainUseCaseToken = createToken<ListWorktreesMainUseCase>('ListWorktreesMainUseCase')
export const GetWorktreeStatusMainUseCaseToken =
  createToken<GetWorktreeStatusMainUseCase>('GetWorktreeStatusMainUseCase')
export const CreateWorktreeMainUseCaseToken = createToken<CreateWorktreeMainUseCase>('CreateWorktreeMainUseCase')
export const DeleteWorktreeMainUseCaseToken = createToken<DeleteWorktreeMainUseCase>('DeleteWorktreeMainUseCase')
export const SuggestPathMainUseCaseToken = createToken<SuggestPathMainUseCase>('SuggestPathMainUseCase')
export const CheckDirtyMainUseCaseToken = createToken<CheckDirtyMainUseCase>('CheckDirtyMainUseCase')
export const GetDefaultBranchMainUseCaseToken = createToken<GetDefaultBranchMainUseCase>('GetDefaultBranchMainUseCase')
```

### Tauri Core (Rust)側 DI Config

```typescript
// src-tauri/src/features/worktree_management/di-config.ts (概念例)
import type { VContainerConfig } from '@lib/di'
import { CheckDirtyMainUseCase } from './application/usecases/check-dirty-main-usecase'
import { CreateWorktreeMainUseCase } from './application/usecases/create-worktree-main-usecase'
import { DeleteWorktreeMainUseCase } from './application/usecases/delete-worktree-main-usecase'
import { GetDefaultBranchMainUseCase } from './application/usecases/get-default-branch-main-usecase'
import { GetWorktreeStatusMainUseCase } from './application/usecases/get-worktree-status-main-usecase'
import { ListWorktreesMainUseCase } from './application/usecases/list-worktrees-main-usecase'
import { SuggestPathMainUseCase } from './application/usecases/suggest-path-main-usecase'
import {
  CheckDirtyMainUseCaseToken,
  CreateWorktreeMainUseCaseToken,
  DeleteWorktreeMainUseCaseToken,
  GetDefaultBranchMainUseCaseToken,
  GetWorktreeStatusMainUseCaseToken,
  ListWorktreesMainUseCaseToken,
  SuggestPathMainUseCaseToken,
  WorktreeGitDefaultRepositoryToken,
  WorktreeWatcherToken,
} from './di-tokens'
import { WorktreeGitDefaultRepository } from './infrastructure/worktree-git-service'
import { WorktreeWatcher } from './infrastructure/worktree-watcher'
import { registerIPCHandlers } from './presentation/ipc-handlers'

export const worktreeManagementMainConfig: VContainerConfig = {
  register(container) {
    // Infrastructure (singleton)
    container
      .registerSingleton(WorktreeGitDefaultRepositoryToken, WorktreeGitDefaultRepository)
      .registerSingleton(WorktreeWatcherToken, WorktreeWatcher)

    // Application UseCases (singleton, deps で依存関係を宣言)
    container
      .registerSingleton(ListWorktreesMainUseCaseToken, ListWorktreesMainUseCase, [WorktreeGitDefaultRepositoryToken])
      .registerSingleton(GetWorktreeStatusMainUseCaseToken, GetWorktreeStatusMainUseCase, [WorktreeGitDefaultRepositoryToken])
      .registerSingleton(CreateWorktreeMainUseCaseToken, CreateWorktreeMainUseCase, [WorktreeGitDefaultRepositoryToken])
      .registerSingleton(DeleteWorktreeMainUseCaseToken, DeleteWorktreeMainUseCase, [WorktreeGitDefaultRepositoryToken])
      .registerSingleton(SuggestPathMainUseCaseToken, SuggestPathMainUseCase, [WorktreeGitDefaultRepositoryToken])
      .registerSingleton(CheckDirtyMainUseCaseToken, CheckDirtyMainUseCase, [WorktreeGitDefaultRepositoryToken])
      .registerSingleton(GetDefaultBranchMainUseCaseToken, GetDefaultBranchMainUseCase, [WorktreeGitDefaultRepositoryToken])
  },

  setUp: async (container) => {
    const watcher = container.resolve(WorktreeWatcherToken)

    registerIPCHandlers(
      container.resolve(ListWorktreesMainUseCaseToken),
      container.resolve(GetWorktreeStatusMainUseCaseToken),
      container.resolve(CreateWorktreeMainUseCaseToken),
      container.resolve(DeleteWorktreeMainUseCaseToken),
      container.resolve(SuggestPathMainUseCaseToken),
      container.resolve(CheckDirtyMainUseCaseToken),
      container.resolve(GetDefaultBranchMainUseCaseToken),
    )

    return () => {
      watcher.stop()
    }
  },
}
```

### Webview 側 DI Tokens

```typescript
// src/features/worktree-management/di-tokens.ts
import { createToken } from '@lib/di'
import type { Observable } from 'rxjs'
import type {
  WorktreeInfo,
  WorktreeStatus,
  WorktreeCreateParams,
  WorktreeDeleteParams,
  WorktreeChangeEvent,
} from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  ConsumerUseCase,
  RunnableUseCase,
  FunctionUseCase,
  ObservableStoreUseCase,
} from '@lib/usecase/types'
import type { ParameterizedService } from '@lib/service'

// --- Repository IF ---
export interface WorktreeRepository {
  list(repoPath: string): Promise<WorktreeInfo[]>
  getStatus(repoPath: string, worktreePath: string): Promise<WorktreeStatus>
  create(params: WorktreeCreateParams): Promise<WorktreeInfo>
  delete(params: WorktreeDeleteParams): Promise<void>
  suggestPath(repoPath: string, branch: string): Promise<string>
  checkDirty(worktreePath: string): Promise<boolean>
  onChanged(callback: (event: WorktreeChangeEvent) => void): () => void
}

// --- Service IF ---
export interface WorktreeService extends ParameterizedService<WorktreeInfo[]> {
  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedWorktreePath$: Observable<string | null>
  readonly sortOrder$: Observable<WorktreeSortOrder>
  updateWorktrees(worktrees: WorktreeInfo[]): void
  setSelectedWorktree(path: string | null): void
  setSortOrder(order: WorktreeSortOrder): void
}

// --- ViewModel IF ---
export interface WorktreeListViewModel {
  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedPath$: Observable<string | null>
  selectWorktree(path: string | null): void
  createWorktree(params: WorktreeCreateParams): void
  deleteWorktree(params: WorktreeDeleteParams): void
  refreshWorktrees(): void
  setSortOrder(order: WorktreeSortOrder): void
}

export interface WorktreeDetailViewModel {
  readonly selectedWorktree$: Observable<WorktreeInfo | null>
}

// --- Detail 用 UseCase 型 ---
export type GetSelectedWorktreeUseCase = ObservableStoreUseCase<WorktreeInfo | null>
export type GetWorktreeStatusUseCase = FunctionUseCase<{ repoPath: string; worktreePath: string }, Promise<WorktreeStatus>>

// --- UseCase 型 ---
export type ListWorktreesUseCase = ObservableStoreUseCase<WorktreeInfo[]>
export type SelectWorktreeUseCase = ConsumerUseCase<string | null>
export type CreateWorktreeUseCase = ConsumerUseCase<WorktreeCreateParams>
export type DeleteWorktreeUseCase = ConsumerUseCase<WorktreeDeleteParams>
export type RefreshWorktreesUseCase = RunnableUseCase
export type SuggestPathUseCase = FunctionUseCase<{ repoPath: string; branch: string }, Promise<string>>
export type CheckDirtyUseCase = FunctionUseCase<string, Promise<boolean>>
export type GetSelectedPathUseCase = ObservableStoreUseCase<string | null>
export type SetSortOrderUseCase = ConsumerUseCase<WorktreeSortOrder>

// --- Token 定義 ---
// Repository
export const WorktreeRepositoryToken = createToken<WorktreeRepository>('WorktreeRepository')
// Service
export const WorktreeServiceToken = createToken<WorktreeService>('WorktreeService')
// UseCases
export const ListWorktreesUseCaseToken = createToken<ListWorktreesUseCase>('ListWorktreesUseCase')
export const SelectWorktreeUseCaseToken = createToken<SelectWorktreeUseCase>('SelectWorktreeUseCase')
export const CreateWorktreeUseCaseToken = createToken<CreateWorktreeUseCase>('CreateWorktreeUseCase')
export const DeleteWorktreeUseCaseToken = createToken<DeleteWorktreeUseCase>('DeleteWorktreeUseCase')
export const RefreshWorktreesUseCaseToken = createToken<RefreshWorktreesUseCase>('RefreshWorktreesUseCase')
export const SuggestPathUseCaseToken = createToken<SuggestPathUseCase>('SuggestPathUseCase')
export const CheckDirtyUseCaseToken = createToken<CheckDirtyUseCase>('CheckDirtyUseCase')
export const GetSelectedWorktreeUseCaseToken = createToken<GetSelectedWorktreeUseCase>('GetSelectedWorktreeUseCase')
export const GetWorktreeStatusUseCaseToken = createToken<GetWorktreeStatusUseCase>('GetWorktreeStatusUseCase')
export const GetSelectedPathUseCaseToken = createToken<GetSelectedPathUseCase>('GetSelectedPathUseCase')
export const SetSortOrderUseCaseToken = createToken<SetSortOrderUseCase>('SetSortOrderUseCase')
// ViewModels
export const WorktreeListViewModelToken = createToken<WorktreeListViewModel>('WorktreeListViewModel')
export const WorktreeDetailViewModelToken = createToken<WorktreeDetailViewModel>('WorktreeDetailViewModel')
```

### Webview 側 DI Config

```typescript
// src/features/worktree-management/di-config.ts
import type { VContainerConfig } from '@lib/di'
import { RepositoryServiceToken } from '@/features/application-foundation/di-tokens'
import { CheckDirtyDefaultUseCase } from './application/usecases/check-dirty-usecase'
import { CreateWorktreeDefaultUseCase } from './application/usecases/create-worktree-usecase'
import { DeleteWorktreeDefaultUseCase } from './application/usecases/delete-worktree-usecase'
import { GetSelectedPathDefaultUseCase } from './application/usecases/get-selected-path-usecase'
import { GetSelectedWorktreeDefaultUseCase } from './application/usecases/get-selected-worktree-usecase'
import { GetWorktreeStatusDefaultUseCase } from './application/usecases/get-worktree-status-usecase'
import { ListWorktreesDefaultUseCase } from './application/usecases/list-worktrees-usecase'
import { RefreshWorktreesDefaultUseCase } from './application/usecases/refresh-worktrees-usecase'
import { SelectWorktreeDefaultUseCase } from './application/usecases/select-worktree-usecase'
import { SetSortOrderDefaultUseCase } from './application/usecases/set-sort-order-usecase'
import { SuggestPathDefaultUseCase } from './application/usecases/suggest-path-usecase'
import { WorktreeService } from './application/services/worktree-service'
import {
  CheckDirtyUseCaseToken,
  CreateWorktreeUseCaseToken,
  DeleteWorktreeUseCaseToken,
  GetSelectedPathUseCaseToken,
  GetSelectedWorktreeUseCaseToken,
  GetWorktreeStatusUseCaseToken,
  ListWorktreesUseCaseToken,
  RefreshWorktreesUseCaseToken,
  SelectWorktreeUseCaseToken,
  SetSortOrderUseCaseToken,
  SuggestPathUseCaseToken,
  WorktreeDetailViewModelToken,
  WorktreeListViewModelToken,
  WorktreeRepositoryToken,
  WorktreeServiceToken,
} from './di-tokens'
import { WorktreeDefaultRepository } from './infrastructure/worktree-default-repository'
import { WorktreeDetailViewModel } from './presentation/worktree-detail-viewmodel'
import { WorktreeListViewModel } from './presentation/worktree-list-viewmodel'

export const worktreeManagementConfig: VContainerConfig = {
  register(container) {
    // 1. Infrastructure (singleton)
    container.registerSingleton(WorktreeRepositoryToken, WorktreeDefaultRepository)

    // 2. Services (singleton)
    container.registerSingleton(WorktreeServiceToken, WorktreeService)

    // 3. UseCases (singleton, useClass + deps)
    container
      .registerSingleton(ListWorktreesUseCaseToken, ListWorktreesDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(SelectWorktreeUseCaseToken, SelectWorktreeDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(CreateWorktreeUseCaseToken, CreateWorktreeDefaultUseCase, [
        WorktreeRepositoryToken,
        WorktreeServiceToken,
      ])
      .registerSingleton(DeleteWorktreeUseCaseToken, DeleteWorktreeDefaultUseCase, [
        WorktreeRepositoryToken,
        WorktreeServiceToken,
      ])
      // RefreshWorktreesUseCase はコールバック引数があるためファクトリー関数
      .registerSingleton(RefreshWorktreesUseCaseToken, () => {
        const repoService = container.resolve(RepositoryServiceToken)
        let currentRepoPath: string | null = null
        repoService.currentRepository$.subscribe((repo) => {
          currentRepoPath = repo?.path ?? null
        })
        return new RefreshWorktreesDefaultUseCase(
          container.resolve(WorktreeRepositoryToken),
          container.resolve(WorktreeServiceToken),
          () => currentRepoPath,
        )
      })
      .registerSingleton(SuggestPathUseCaseToken, SuggestPathDefaultUseCase, [WorktreeRepositoryToken])
      .registerSingleton(CheckDirtyUseCaseToken, CheckDirtyDefaultUseCase, [WorktreeRepositoryToken])
      .registerSingleton(GetSelectedWorktreeUseCaseToken, GetSelectedWorktreeDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(GetSelectedPathUseCaseToken, GetSelectedPathDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(SetSortOrderUseCaseToken, SetSortOrderDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(GetWorktreeStatusUseCaseToken, GetWorktreeStatusDefaultUseCase, [WorktreeRepositoryToken])

    // 4. ViewModels (transient, useClass + deps)
    container
      .registerTransient(WorktreeListViewModelToken, WorktreeListViewModel, [
        ListWorktreesUseCaseToken,
        SelectWorktreeUseCaseToken,
        CreateWorktreeUseCaseToken,
        DeleteWorktreeUseCaseToken,
        RefreshWorktreesUseCaseToken,
        GetSelectedPathUseCaseToken,
        SetSortOrderUseCaseToken,
      ])
      .registerTransient(WorktreeDetailViewModelToken, WorktreeDetailViewModel, [GetSelectedWorktreeUseCaseToken])
  },

  setUp: async (container) => {
    const repo = container.resolve(WorktreeRepositoryToken)
    const service = container.resolve(WorktreeServiceToken)
    const repoService = container.resolve(RepositoryServiceToken)

    service.setUp([])

    // リポジトリ変更時にワークツリー一覧を読み込む
    const repoSubscription = repoService.currentRepository$.subscribe((currentRepo) => {
      if (currentRepo) {
        repo
          .list(currentRepo.path)
          .then((worktrees) => service.updateWorktrees(worktrees))
          .catch(() => service.updateWorktrees([]))
      } else {
        service.updateWorktrees([])
      }
    })

    // worktree-changed イベントの購読（リアルタイム更新）
    const unsubscribeChanged = repo.onChanged(() => {
      const refreshUseCase = container.resolve(RefreshWorktreesUseCaseToken)
      refreshUseCase.invoke()
    })

    return () => {
      repoSubscription.unsubscribe()
      unsubscribeChanged()
      service.tearDown()
    }
  },
}
```

**ライフタイムルール:**
- Infrastructure / Service / UseCase: `singleton`（インスタンス再利用）
- ViewModel: `transient`（useResolve 呼び出しごとに新規作成）

**DI 統合エントリーポイント:**
- `src-tauri/src/di/configs.ts` に `worktreeManagementMainConfig` を追加
- `src/di/configs.ts` に `worktreeManagementConfig` を追加

## 4.4. Webview 側 Clean Architecture 設計

### Application 層: WorktreeService

BehaviorSubject でワークツリーの状態を管理するステートフルサービス。`ParameterizedService<WorktreeInfo[]>` を extends する。

```typescript
// src/features/worktree-management/application/services/worktree-service.ts
import { BehaviorSubject, combineLatest, type Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { WorktreeInfo, WorktreeSortOrder } from '@domain'
import type { WorktreeService } from '../../di-tokens'

export class WorktreeDefaultService implements WorktreeService {
  private readonly _worktrees$ = new BehaviorSubject<WorktreeInfo[]>([])
  private readonly _selectedWorktreePath$ = new BehaviorSubject<string | null>(null)
  private readonly _sortOrder$ = new BehaviorSubject<WorktreeSortOrder>('name')

  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedWorktreePath$: Observable<string | null>
  readonly sortOrder$: Observable<WorktreeSortOrder>

  constructor() {
    this.worktrees$ = combineLatest([this._worktrees$, this._sortOrder$]).pipe(
      map(([worktrees, order]) => this.sortWorktrees(worktrees, order)),
    )
    this.selectedWorktreePath$ = this._selectedWorktreePath$.asObservable()
    this.sortOrder$ = this._sortOrder$.asObservable()
  }

  setUp(initialWorktrees: WorktreeInfo[]): void {
    this._worktrees$.next(initialWorktrees)
  }

  tearDown(): void {
    this._worktrees$.complete()
    this._selectedWorktreePath$.complete()
    this._sortOrder$.complete()
  }

  updateWorktrees(worktrees: WorktreeInfo[]): void {
    this._worktrees$.next(worktrees)
  }

  setSelectedWorktree(path: string | null): void {
    this._selectedWorktreePath$.next(path)
  }

  setSortOrder(order: WorktreeSortOrder): void {
    this._sortOrder$.next(order)
  }

  private sortWorktrees(worktrees: WorktreeInfo[], order: WorktreeSortOrder): WorktreeInfo[] {
    // 'name': パスのベース名でアルファベット順
    // 'last-updated': latest commit author date の降順
  }
}
```

### Application 層: UseCase 実装パターン

各 UseCase は `di-tokens.ts` の型エイリアスを implements し、コンストラクタで Repository / Service を受け取る。

```typescript
// ObservableStore パターン（読み取り専用ストリーム）
export class ListWorktreesDefaultUseCase implements ObservableStoreUseCase<WorktreeInfo[]> {
  constructor(private readonly service: WorktreeService) {}
  get store(): Observable<WorktreeInfo[]> {
    return this.service.worktrees$
  }
}

// Consumer パターン（副作用のみ）
export class CreateWorktreeDefaultUseCase implements ConsumerUseCase<WorktreeCreateParams> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
  ) {}
  invoke(params: WorktreeCreateParams): void {
    this.repo.create(params).then(() => {
      this.repo.list(params.repoPath).then((worktrees) => {
        this.service.updateWorktrees(worktrees)
      })
    })
  }
}

// Runnable パターン（引数なし実行）
export class RefreshWorktreesDefaultUseCase implements RunnableUseCase {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
  ) {}
  invoke(): void {
    // repoPath は RepositoryService から取得（application-foundation 連携）
  }
}

// Function パターン（値を返す）
export class SuggestPathDefaultUseCase implements FunctionUseCase<{ repoPath: string; branch: string }, Promise<string>> {
  constructor(private readonly repo: WorktreeRepository) {}
  invoke(arg: { repoPath: string; branch: string }): Promise<string> {
    return this.repo.suggestPath(arg.repoPath, arg.branch)
  }
}
```

### Infrastructure 層: WorktreeDefaultRepository

IPC クライアントとして `invokeCommand / listenEvent ラッパー.worktree` を呼び出し、`IPCResult<T>` を例外に変換する。

```typescript
// src/features/worktree-management/infrastructure/worktree-default-repository.ts
import type { WorktreeRepository } from '../di-tokens'

export class WorktreeDefaultRepository implements WorktreeRepository {
  async list(repoPath: string): Promise<WorktreeInfo[]> {
    const result = await invokeCommand<WorktreeInfo[]>('worktree_list', { repoPath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async create(params: WorktreeCreateParams): Promise<WorktreeInfo> {
    const result = await invokeCommand<WorktreeInfo>('worktree_create', { params })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async delete(params: WorktreeDeleteParams): Promise<void> {
    const result = await invokeCommand<void>('worktree_delete', { params })
    if (result.success === false) throw new Error(result.error.message)
  }

  // ... getStatus, suggestPath, checkDirty も同パターン

  onChanged(callback: (event: WorktreeChangeEvent) => void): () => void {
    return listenEventSync<WorktreeChangeEvent>('worktree-changed', (event) => {
      callback(event)
    })
  }
}
```

### Presentation 層: ViewModel

ViewModel は UseCase を集約し、Observable でデータを公開する。

```typescript
// src/features/worktree-management/presentation/worktree-list-viewmodel.ts
export class WorktreeListDefaultViewModel implements WorktreeListViewModel {
  constructor(
    private readonly listUseCase: ListWorktreesUseCase,
    private readonly selectUseCase: SelectWorktreeUseCase,
    private readonly createUseCase: CreateWorktreeUseCase,
    private readonly deleteUseCase: DeleteWorktreeUseCase,
    private readonly refreshUseCase: RefreshWorktreesUseCase,
    private readonly getSelectedPathUseCase: GetSelectedPathUseCase,
    private readonly setSortOrderUseCase: SetSortOrderUseCase,
  ) {}

  get worktrees$(): Observable<WorktreeInfo[]> {
    return this.listUseCase.store
  }

  get selectedPath$(): Observable<string | null> {
    return this.getSelectedPathUseCase.store
  }

  selectWorktree(path: string | null): void {
    this.selectUseCase.invoke(path)
  }

  createWorktree(params: WorktreeCreateParams): void {
    this.createUseCase.invoke(params)
  }

  deleteWorktree(params: WorktreeDeleteParams): void {
    this.deleteUseCase.invoke(params)
  }

  refreshWorktrees(): void {
    this.refreshUseCase.invoke()
  }

  setSortOrder(order: WorktreeSortOrder): void {
    this.setSortOrderUseCase.invoke(order)
  }
}
```

### Presentation 層: Hook ラッパー

```typescript
// src/features/worktree-management/presentation/use-worktree-list-viewmodel.ts
import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { WorktreeListViewModelToken } from '../di-tokens'

export function useWorktreeListViewModel() {
  const vm = useResolve(WorktreeListViewModelToken)
  const worktrees = useObservable(vm.worktrees$, [])
  const selectedPath = useObservable(vm.selectedPath$, null)

  return {
    worktrees,
    selectedPath,
    selectWorktree: useCallback((path: string | null) => vm.selectWorktree(path), [vm]),
    createWorktree: useCallback((params: WorktreeCreateParams) => vm.createWorktree(params), [vm]),
    deleteWorktree: useCallback((params: WorktreeDeleteParams) => vm.deleteWorktree(params), [vm]),
    refreshWorktrees: useCallback(() => vm.refreshWorktrees(), [vm]),
    setSortOrder: useCallback((order: WorktreeSortOrder) => vm.setSortOrder(order), [vm]),
  }
}
```

### RxJS リアクティブデータフロー

ワークツリー状態変化のリアルタイム更新パイプライン:

1. **Main Process**: `WorktreeWatcher`（notify + notify-debouncer-full）が `.git/worktrees` の変更を検出
2. **Main → Renderer**: `window.app_handle.emit('worktree-changed', event)` で IPC イベント送信
3. **Renderer Infrastructure**: `WorktreeDefaultRepository.onChanged` コールバック発火
4. **Renderer Application**: `RefreshWorktreesUseCase.invoke()` → `WorktreeRepository.list()` → `WorktreeService.updateWorktrees()` で BehaviorSubject 更新
5. **Renderer Presentation**: `WorktreeListViewModel.worktrees$` が再発行 → `useObservable` で React state 更新 → UI 再レンダリング

```mermaid
sequenceDiagram
    participant FS as ファイルシステム
    participant Watcher as WorktreeWatcher<br/>(main/infrastructure)
    participant Event as "@tauri-apps/api/event"<br/>(listen)
    participant RepoDefault as WorktreeDefaultRepository<br/>(renderer/infrastructure)
    participant Refresh as RefreshWorktreesUseCase<br/>(renderer/application)
    participant Service as WorktreeService<br/>(renderer/application)
    participant VM as WorktreeListViewModel<br/>(renderer/presentation)
    participant Hook as useWorktreeListViewModel
    participant UI as React Component

    FS->>Watcher: ファイル変更検出
    Note over Watcher: 300ms デバウンス
    Watcher->>IPC: worktree-changed イベント
    IPC->>RepoDefault: listenEventSync コールバック
    RepoDefault->>Refresh: invoke()
    Refresh->>RepoDefault: list(repoPath)
    RepoDefault-->>Refresh: WorktreeInfo[]
    Refresh->>Service: updateWorktrees(worktrees)
    Service->>VM: worktrees$ (BehaviorSubject 再発行)
    VM->>Hook: useObservable で state 更新
    Hook->>UI: React 再レンダリング
```

---

# 5. データモデル

```typescript
// src/domain/index.ts に追加

// ワークツリー情報（git worktree list --porcelain のパース結果）
export interface WorktreeInfo {
  path: string;           // ワークツリーのファイルシステムパス
  branch: string | null;  // チェックアウト中のブランチ名（detached HEAD の場合 null）
  head: string;           // HEAD コミットの SHA（短縮形）
  headMessage: string;    // HEAD コミットメッセージ（1行目）
  isMain: boolean;        // メインワークツリーかどうか
  isDirty: boolean;       // 未コミット変更があるか
}

// ワークツリー詳細ステータス
interface WorktreeStatus {
  worktree: WorktreeInfo;
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
}

// ファイル変更情報
interface FileChange {
  path: string;
  status: FileChangeStatus;
  oldPath?: string;  // renamed/copied の場合のリネーム元パス
}

type FileChangeStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied';

// ワークツリー作成パラメータ
interface WorktreeCreateParams {
  repoPath: string;
  worktreePath: string;
  branch: string;
  createNewBranch: boolean;
  startPoint?: string;
}

// ワークツリー削除パラメータ
interface WorktreeDeleteParams {
  repoPath: string;
  worktreePath: string;
  force: boolean;
  deleteBranch: boolean;         // FR_103_05: ローカルブランチも同時に削除するか
}

// ブランチ削除結果（FR_103_05）
type BranchDeleteResult =
  | { deleted: true; branchName: string }
  | { deleted: false; branchName: string; skipped: true; skipReason: string }
  | { deleted: false; branchName: string; requireForce: true };

// ワークツリー作成結果（FR_106）
interface WorktreeCreateResult {
  worktree: WorktreeInfo;
  symlink?: SymlinkResult;       // シンボリックリンク処理結果（設定がない場合は undefined）
}

// シンボリックリンク設定（FR_106）
interface SymlinkConfig {
  patterns: string[];            // glob パターンの配列
  source: 'app' | 'repo';       // 設定の取得元
}

// シンボリックリンク作成結果（FR_106）
interface SymlinkResult {
  entries: SymlinkResultEntry[];
  totalCreated: number;
  totalSkipped: number;
  totalFailed: number;
}

interface SymlinkResultEntry {
  pattern: string;
  status: 'created' | 'skipped' | 'partial' | 'failed';
  matched: number;
  created: number;
  failed: number;
  reason?: string;
}

// ワークツリー状態変化イベント
interface WorktreeChangeEvent {
  repoPath: string;
  type: 'added' | 'removed' | 'modified';
  worktreePath: string;
}

// ワークツリー一覧の並び替えオプション
// 'name': パスのベース名でアルファベット昇順
// 'last-updated': latest commit author date（git log -1 --format=%aI）の降順
export type WorktreeSortOrder = 'name' | 'last-updated';
```

---

# 6. インターフェース定義

> **注記**: 実装では Rust の `#[tauri::command]` マクロで各コマンドを定義し、`lib.rs` の `invoke_handler!` で一括登録している。

## 6.1. IPC ハンドラー（Tauri Core (Rust) presentation 層）

`wrapHandler<T>()` ユーティリティを使い、UseCase の戻り値を `IPCResult<T>` に統一する。ハンドラーは7つの個別 UseCase を受け取り、各 UseCase の `invoke()` メソッドを呼び出す。

```rs
// src-tauri/src/features/worktree_management/presentation/commands.rs (概念例)
import type { WorktreeCreateParams, WorktreeDeleteParams } from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  CheckDirtyMainUseCase,
  CreateWorktreeMainUseCase,
  DeleteWorktreeMainUseCase,
  GetDefaultBranchMainUseCase,
  GetWorktreeStatusMainUseCase,
  ListWorktreesMainUseCase,
  SuggestPathMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@lib/ipc'
// Tauri (@tauri-apps/api): #[tauri::command]

// wrapHandler は UseCase が返す素の値を IPCResult<T> に変換し、例外を ipcFailure に変換する
function wrapHandler<T>(handler: () => T | Promise<T>): Promise<IPCResult<Awaited<T>>> {
  return Promise.resolve()
    .then(() => handler())
    .then((data) => ipcSuccess(data as Awaited<T>))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return ipcFailure<Awaited<T>>('INTERNAL_ERROR', message)
    })
}

export function registerIPCHandlers(
  listUseCase: ListWorktreesMainUseCase,
  getStatusUseCase: GetWorktreeStatusMainUseCase,
  createUseCase: CreateWorktreeMainUseCase,
  deleteUseCase: DeleteWorktreeMainUseCase,
  suggestPathUseCase: SuggestPathMainUseCase,
  checkDirtyUseCase: CheckDirtyMainUseCase,
  getDefaultBranchUseCase: GetDefaultBranchMainUseCase,
): void {
  #[tauri::command]('worktree:list', (_event, repoPath: string) =>
    wrapHandler(() => listUseCase.invoke(repoPath)),
  )

  #[tauri::command]('worktree:status', (_event, params: { repoPath: string; worktreePath: string }) =>
    wrapHandler(() => getStatusUseCase.invoke(params)),
  )

  #[tauri::command]('worktree:create', (_event, params: WorktreeCreateParams) =>
    wrapHandler(() => createUseCase.invoke(params)),
  )

  #[tauri::command]('worktree:delete', (_event, params: WorktreeDeleteParams) =>
    wrapHandler(() => deleteUseCase.invoke(params)),
  )

  #[tauri::command]('worktree:suggest-path', (_event, params: { repoPath: string; branch: string }) =>
    wrapHandler(() => suggestPathUseCase.invoke(params)),
  )

  #[tauri::command]('worktree:check-dirty', (_event, worktreePath: string) =>
    wrapHandler(() => checkDirtyUseCase.invoke(worktreePath)),
  )

  #[tauri::command]('worktree:default-branch', (_event, repoPath: string) =>
    wrapHandler(() => getDefaultBranchUseCase.invoke(repoPath)),
  )
}
```

## 6.2. Tauri Core (Rust) Application 層

### 個別 UseCase クラス（7つ）

各 UseCase は `FunctionUseCase<T, R>` を implements し、コンストラクタで `WorktreeGitRepository` を受け取る。**IPCResult を返さない**（presentation 層の wrapHandler が処理）。配置先は `src-tauri/src/features/worktree_management/application/usecases/` ディレクトリ。

| UseCase クラス | 型パラメータ | 責務 |
|---------------|------------|------|
| ListWorktreesMainUseCase | `FunctionUseCase<string, Promise<WorktreeInfo[]>>` | ワークツリー一覧取得 + dirty 並列チェック |
| GetWorktreeStatusMainUseCase | `FunctionUseCase<{repoPath, worktreePath}, Promise<WorktreeStatus>>` | ワークツリーステータス取得 |
| CreateWorktreeMainUseCase | `FunctionUseCase<WorktreeCreateParams, Promise<WorktreeInfo>>` | ワークツリー作成 |
| DeleteWorktreeMainUseCase | `FunctionUseCase<WorktreeDeleteParams, Promise<void>>` | ワークツリー削除（メイン WT 保護付き） |
| SuggestPathMainUseCase | `FunctionUseCase<{repoPath, branch}, Promise<string>>` | パス提案（メイン WT パス解決） |
| CheckDirtyMainUseCase | `FunctionUseCase<string, Promise<boolean>>` | dirty チェック |
| GetDefaultBranchMainUseCase | `FunctionUseCase<string, Promise<string>>` | デフォルトブランチ検出 |

代表的な実装例:

```typescript
// src-tauri/src/features/worktree_management/application/usecases/list_worktrees_main_usecase.rs (概念例)
import type { WorktreeInfo } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../worktree-interfaces'

export class ListWorktreesMainUseCase implements FunctionUseCase<string, Promise<WorktreeInfo[]>> {
  constructor(private readonly gitService: WorktreeGitRepository) {}

  async invoke(repoPath: string): Promise<WorktreeInfo[]> {
    const worktrees = await this.gitService.listWorktrees(repoPath)
    // 各ワークツリーの dirty チェックを並列実行
    const results = await Promise.all(
      worktrees.map(async (wt) => ({
        ...wt,
        isDirty: await this.gitService.isDirty(wt.path),
      })),
    )
    return results
  }
}

// src-tauri/src/features/worktree_management/application/usecases/delete_worktree_main_usecase.rs (概念例)
import type { WorktreeDeleteParams } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../worktree-interfaces'

export class DeleteWorktreeMainUseCase
  implements FunctionUseCase<WorktreeDeleteParams, Promise<void>>
{
  constructor(private readonly gitService: WorktreeGitRepository) {}

  async invoke(params: WorktreeDeleteParams): Promise<void> {
    // メインワークツリー削除防止（サービス層チェック）
    const isMain = await this.gitService.isMainWorktree(params.worktreePath)
    if (isMain) {
      throw new Error('メインワークツリーは削除できません')
    }
    await this.gitService.removeWorktree(params.worktreePath, params.force)
  }
}

// src-tauri/src/features/worktree_management/application/usecases/suggest_path_main_usecase.rs (概念例)
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../worktree-interfaces'
import path from 'node:path'

export class SuggestPathMainUseCase
  implements FunctionUseCase<{ repoPath: string; branch: string }, Promise<string>>
{
  constructor(private readonly gitService: WorktreeGitRepository) {}

  async invoke(params: { repoPath: string; branch: string }): Promise<string> {
    // メインワークツリーのパスを基準にする
    const worktrees = await this.gitService.listWorktrees(params.repoPath)
    const mainWorktree = worktrees.find((wt) => wt.isMain)
    const basePath = mainWorktree?.path ?? params.repoPath

    const parentDir = path.dirname(basePath)
    const repoName = path.basename(basePath)
    const sanitizedBranch = params.branch.replace(/[/\\:*?"<>|]/g, '-')
    return path.join(parentDir, `${repoName}+${sanitizedBranch}`)
  }
}
```

### WorktreeGitRepository インターフェース

```typescript
// src-tauri/src/features/worktree_management/application/worktree_interfaces.rs (概念例)
import type { WorktreeInfo, WorktreeStatus, WorktreeCreateParams } from '@domain'
import type { AppHandle } from '@tauri-apps/api'

export interface WorktreeGitRepository {
  listWorktrees(repoPath: string): Promise<WorktreeInfo[]>
  getStatus(worktreePath: string): Promise<WorktreeStatus>
  addWorktree(params: WorktreeCreateParams): Promise<WorktreeInfo>
  removeWorktree(worktreePath: string, force: boolean): Promise<void>
  isMainWorktree(worktreePath: string): Promise<boolean>
  isDirty(worktreePath: string): Promise<boolean>
  getDefaultBranch(repoPath: string): Promise<string>
}

export interface WorktreeWatcher {
  start(repoPath: string, appHandle: AppHandle): void
  stop(): void
}
```

## 6.3. Tauri Core (Rust) Infrastructure 層

### WorktreeGitDefaultRepository

```rust
// src-tauri/src/features/worktree_management/infrastructure/worktree_git_service.rs (概念例)
// Rust 実装: tokio::process::Command 経由の git CLI

impl WorktreeGitRepository for WorktreeGitDefaultRepository {
  async fn list_worktrees(&self, repo_path: &str) -> Result<Vec<WorktreeInfo>> {
    // Rust 実装: tokio::process::Command::new("git")
    //   .args(["-C", repo_path, "worktree", "list", "--porcelain"])
    //   で実行し出力をパース
  }

  async fn get_status(&self, worktree_path: &str) -> Result<WorktreeStatus> {
    // Rust 実装: tokio::process::Command::new("git")
    //   .args(["-C", worktree_path, "status", "--porcelain"])
    //   で実行し出力をパース
  }

  async fn add_worktree(&self, params: &WorktreeCreateParams) -> Result<WorktreeInfo> {
    // Rust 実装: tokio::process::Command::new("git")
    //   .args(["-C", &params.repo_path, "worktree", "add", ...])
    //   create_new_branch ? git worktree add -b <branch> <path> <start-point>
    //                     : git worktree add <path> <branch>
  }

  async fn remove_worktree(&self, worktree_path: &str, force: bool) -> Result<()> {
    // git worktree remove [--force] <path>
  }

  async fn is_main_worktree(&self, worktree_path: &str) -> Result<bool> {
    // .git がファイルではなくディレクトリならメインワークツリー
  }

  async fn is_dirty(&self, worktree_path: &str) -> Result<bool> {
    // Rust 実装: tokio::process::Command::new("git")
    //   .args(["-C", worktree_path, "status", "--porcelain"])
    //   で実行し出力が空でなければ dirty
  }
}
```

> **設計判断:** `isDirty(worktreePath)` は `repoPath` を受け取らない。git CLI は `-C worktreePath` でワークツリーパスを直接指定して実行でき、`.git` ファイル経由で親リポジトリを自動的に解決する。

### WorktreeWatcher

```typescript
// src-tauri/src/features/worktree_management/infrastructure/worktree_watcher.rs (概念例)
// Rust 側: notify + notify-debouncer-full crate による実装
import type { WorktreeWatcher } from '../application/worktree_interfaces'

export class WorktreeDefaultWatcher implements WorktreeWatcher {
  // Rust 側では RecommendedWatcher + DebounceEventHandler で実装

  start(repoPath: string, appHandle: AppHandle): void {
    // .git/worktrees ディレクトリを notify + notify-debouncer-full で監視
    // デバウンス: 300ms（短時間の連続イベントを集約）
    // 変更検出時: window.app_handle.emit('worktree-changed', event)
  }

  stop(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.watcher?.close()
    this.watcher = null
  }
}
```

**ライフサイクル:**
- `start()`: DI Config の `setUp()` 内で、リポジトリが開かれた後に呼び出す
- `stop()`: DI Config の tearDown 関数内で呼び出す
- リポジトリ切り替え時: `stop()` → 新しい `repoPath` で `start()` を再呼び出し

## 6.4. Tauri invoke/listen API

> **重要:** Tauri 移行後は `@tauri-apps/api` を直接 import し、`src/lib/invoke/commands.ts` の `invokeCommand<T>` ラッパー経由で呼び出す。preload 層は Tauri では不要のため削除する。worktree 名前空間は `src/lib/invoke/tauri-api.ts` にヘルパー関数として集約する。

```ts
// src/lib/invoke/tauri-api.ts の worktree セクション
import { invokeCommand } from './commands'
import type {
  WorktreeInfo,
  WorktreeStatus,
  WorktreeCreateParams,
  WorktreeDeleteParams,
} from '@/shared/domain'

export const worktreeApi = {
  list: (repoPath: string) =>
    invokeCommand<WorktreeInfo[]>('worktree_list', { repoPath }),
  status: (repoPath: string, worktreePath: string) =>
    invokeCommand<WorktreeStatus>('worktree_status', { repoPath, worktreePath }),
  create: (params: WorktreeCreateParams) =>
    invokeCommand<WorktreeInfo>('worktree_create', { params }),
  delete: (params: WorktreeDeleteParams) =>
    invokeCommand<void>('worktree_delete', { params }),
  suggestPath: (repoPath: string, branch: string) =>
    invokeCommand<string>('worktree_suggest_path', { repoPath, branch }),
  checkDirty: (worktreePath: string) =>
    invokeCommand<boolean>('worktree_check_dirty', { worktreePath }),
  defaultBranch: (repoPath: string) =>
    invokeCommand<string>('worktree_default_branch', { repoPath }),
  onChanged: (callback: (event: WorktreeChangeEvent) => void): (() => void) => {
    return listenEventSync<WorktreeChangeEvent>('worktree-changed', (event) => {
      callback(event)
    })
  },
}
```

### IPC 型定義の拡張

`src/lib/ipc.ts` に以下を追加:

```typescript
// IPCChannelMap に追加
'worktree:list': { args: [string]; result: IPCResult<WorktreeInfo[]> }
'worktree:status': { args: [{ repoPath: string; worktreePath: string }]; result: IPCResult<WorktreeStatus> }
'worktree:create': { args: [WorktreeCreateParams]; result: IPCResult<WorktreeCreateResult> }  // FR_106: 戻り値を WorktreeCreateResult に変更
'worktree:delete': { args: [WorktreeDeleteParams]; result: IPCResult<BranchDeleteResult | null> }  // FR_103_05: ブランチ削除結果を返す
'worktree:suggest-path': { args: [{ repoPath: string; branch: string }]; result: IPCResult<string> }
'worktree:check-dirty': { args: [string]; result: IPCResult<boolean> }
'worktree:default-branch': { args: [string]; result: IPCResult<string> }
'worktree:symlink-config-get': { args: [{ repoPath: string }]; result: IPCResult<SymlinkConfig> }  // FR_106: 設定取得
'worktree:symlink-config-set': { args: [{ repoPath: string; config: SymlinkConfig }]; result: IPCResult<void> }  // FR_106: 設定保存（repoPath 付き）

// FR_102_05: ブランチ一覧は basic-git-operations の既存 'git:branches' コマンドを再利用（IPCChannelMap 登録済み）

// IPCEventMap に追加
'worktree-changed': WorktreeChangeEvent

// Tauri invoke/listen API（src/lib/invoke/tauri-api.ts で定義）
// worktreeApi.list(), worktreeApi.status() 等の型安全なラッパー関数として公開
```

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|------|----------|
| 一覧表示1秒以内 (NFR_101) | `git worktree list --porcelain` は高速。dirty チェックは並列実行（Promise.all）。50ワークツリーまでは問題なし |
| 切り替え500ms以内 (NFR_102) | `worktree_status` は単一ワークツリーの `git status --porcelain` のみ。軽量操作 |
| リアルタイム更新 (FR_105) | notify + notify-debouncer-full の `.git/worktrees` 監視 + 300ms デバウンス。不要な再取得を防止 |
| Tauri セキュリティ (A-001, T-003) | すべての Git 操作はTauri Core (Rust)で実行。invoke/listen API 経由の通信のみ |
| 安全性 (B-002) | 削除前に dirty チェック + 確認ダイアログ。メインワークツリー削除はサービス層で防止 |

---

# 8. テスト戦略

**テストフレームワーク:** Vitest + Testing Library（React Testing Library でコンポーネントテスト）

| テストレベル | 対象 | プロセス | 層 | カバレッジ目標 |
|------------|------|---------|-----|------------|
| ユニットテスト | 個別 UseCase（List, Status, Create, Delete, SuggestPath, CheckDirty, DefaultBranch） | main | application | ≥ 80% |
| ユニットテスト | WorktreeGitDefaultRepository — `git worktree list --porcelain` 出力パース | main | infrastructure | ≥ 90% |
| ユニットテスト | WorktreeCreateParams / WorktreeDeleteParams バリデーション | main | application | ≥ 80% |
| ユニットテスト | WorktreeService（BehaviorSubject 状態管理、ソート処理） | renderer | application | ≥ 80% |
| ユニットテスト | UseCases（List, Create, Delete, Select, Refresh） | renderer | application | ≥ 80% |
| ユニットテスト | ViewModels（Observable 公開、メソッド委譲） | renderer | presentation | ≥ 80% |
| コンポーネントテスト | WorktreeList, WorktreeListItem の描画・選択・イベント | renderer | presentation | ≥ 60% |
| コンポーネントテスト | WorktreeCreateDialog, WorktreeDeleteDialog のフォーム操作 | renderer | presentation | ≥ 60% |
| 結合テスト | IPC Handlers → 個別 UseCase → WorktreeGitDefaultRepository 連携 | main | 全層 | 主要フロー |
| E2Eテスト | ワークツリーの作成→一覧表示→選択→削除のフルフロー | 全体 | — | 主要ユースケース |
| ユニットテスト | FR_103_05: DeleteWorktreeMainUseCase 拡張（ブランチ削除パス、未マージパス、他WT使用中パス） | main | application | ≥ 80% |
| ユニットテスト | FR_106: SymlinkService（glob マッチ判定、スキップ/失敗時の継続動作） | main | application | ≥ 80% |
| ユニットテスト | FR_106: SymlinkConfigDefaultRepository（.buruma/symlink.json 読み込み、app fallback） | main | infrastructure | ≥ 80% |
| ユニットテスト | FR_106: SymlinkFileDefaultRepository（symlink 作成、クロスプラットフォーム対応） | main | infrastructure | ≥ 80% |
| コンポーネントテスト | FR_102_05: BranchCombobox（フィルタリング、グループ表示、選択） | renderer | presentation (共有) | ≥ 60% |

**テスト環境の注意事項:**

- ユニットテスト: WorktreeGitRepository / WorktreeRepository をモック化（DI で注入）
- 結合テスト: git CLI (tokio::process::Command) をモック化し、実際の Git リポジトリを使用しない
- E2E テスト: 一時ディレクトリに Git リポジトリを作成してテスト
- WorktreeWatcher テスト: notify + notify-debouncer-full のイベントをモック化

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項 | 選択肢 | 決定内容 | 理由 |
|----------|--------|----------|------|
| Git 操作ライブラリ | git CLI (tokio::process::Command) / nodegit / isomorphic-git / 生の tokio::process::Command | git CLI (tokio::process::Command) | メンテナンスが活発、API が直感的、`worktree` サブコマンドをサポート。CONSTITUTION.md の技術スタック制約で指定済み（原則 A-002） |
| ファイルシステム監視ライブラリ | notify + notify-debouncer-full / Node.js fs.watch / nsfw | notify + notify-debouncer-full | クロスプラットフォーム対応、デバウンス内蔵、安定した API。fs.watch は OS 間の挙動差が大きい（原則 A-002） |
| worktree list のパース方法 | `--porcelain` 出力パース / `git worktree list` テキストパース | `--porcelain` 出力 | 機械可読フォーマット。テキスト出力は locale 依存のリスクあり |
| dirty チェックの実行タイミング | 一覧取得時に一括 / 個別に遅延取得 | 一覧取得時に並列一括実行 | 50ワークツリーまでは Promise.all で十分高速（NFR_101: 1秒以内）。UX として一覧表示時に dirty 状態を即座に把握できる方が有用 |
| デフォルトパスの提案ロジック | リポジトリ隣接 / リポジトリ内 / 設定パス | リポジトリの親ディレクトリ + ブランチ名のサニタイズ | Git worktree の一般的な配置パターン。リポジトリ名_ブランチ名 の形式（例: `myrepo_feature-foo`） |
| メインワークツリー削除防止の実装箇所 | UI のみ / サービス層のみ / 両方 | UI + サービス層の両方 | 防御的プログラミング。UI でボタンを無効化しつつ、サービス層でもチェック（原則 B-002） |
| IPC チャネル命名 | `worktree-list` / `worktree_list` | `worktree_list`（名前空間方式） | application-foundation と一貫した命名規則。ドメインごとのグルーピング |
| checkDirty の引数設計 | `(repoPath, worktreePath)` / `(worktreePath)` のみ | `(worktreePath)` のみ | git CLI は `-C worktreePath` でワークツリーパスを直接指定して実行でき、`.git` ファイル経由で親リポジトリを自動解決する。repoPath は冗長 |
| WorktreeDetail のスコープ | 基本情報のみ / 詳細（ログ、差分、ファイルツリー）含む | 基本情報のみ（ブランチ、HEAD、dirty 状態、staged/unstaged 件数） | 詳細なコミットログ・差分表示は repository-viewer feature の責務（PRD スコープ外 → FG-2）。本フェーズはワークツリーライフサイクル管理に集中する |
| SortOrder 'last-updated' の定義 | コミット日時 / ファイル更新日時 / 選択日時 | latest commit author date（`git log -1 --format=%aI`） | author date はユーザーが作業を行った時点を反映する。ファイル更新日時はビルド成果物等で不安定 |
| Service の Observable 公開方法 | getter で都度生成 / constructor でフィールド化 | constructor でフィールドとして1回だけ生成 | getter（`get worktrees$() { return combineLatest(...) }`）はアクセスのたびに新しい Observable 参照を返す。`useObservable` Hook が `useEffect` の依存配列で参照比較するため、毎回再購読 → state 更新 → 再レンダリング → 無限ループが発生する。フィールドとして保持することで参照が安定する |
| ブランチ選択 Combobox 配置 (FR_102_05) | 各 feature で個別実装 / src/components/ に共通化 | `src/components/branch-combobox.tsx` に共通コンポーネント | worktree-management と advanced-git-operations（FR_712）で共有。A-004 feature 間直接参照禁止に準拠しつつ DRY を実現 |
| ブランチ削除実行箇所 (FR_103_05) | worktree_delete 内で一括 / フロントエンドから 2段階呼び出し | `worktree_delete` 内で一括実行 | 1回の IPC 呼び出しで完結。worktree remove → branch delete を Rust 側で順次実行。ネットワーク往復を最小化 |
| 未マージブランチの削除方式 (FR_103_05) | 常に -d / 常に -D / -d 試行後 -D 提案 | `-d` 試行後、失敗時に `BranchDeleteResult.requireForce=true` で通知し `-D` を提案 | B-002 準拠。ユーザーの明示的な承認なしに未マージブランチを削除しない |
| シンボリックリンク設定の保存先 (FR_106) | アプリ設定のみ / リポジトリローカルのみ / 2段構成 | アプリデフォルト（tauri-plugin-store）+ リポジトリローカル（`.buruma/symlink.json`）の2段構成 | リポジトリ固有のパターン（node_modules 等）をローカル設定で管理しつつ、アプリデフォルトで共通パターンを提供 |
| glob crate の選定 (FR_106) | `glob` / `globset` / 自作 | `glob` crate | 標準的な glob マッチング。シンプルで軽量。シンボリックリンク対象の検索程度の用途には十分（A-002: Library-First） |
| シンボリックリンクのベース決定 (FR_106) | メインワークツリー固定 / ユーザー選択 / startPoint のWT | メインワークツリー固定 | 常にメインワークツリーからコピーする一貫した動作。ユーザーが混乱しないシンプルな設計 |
| シンボリックリンク失敗時の挙動 (FR_106) | ワークツリー作成ごと失敗 / スキップして続行 | スキップして続行 | シンボリックリンクは付随処理。ワークツリー作成の本質的な操作を失敗させない。SymlinkResult で結果をまとめて通知 |

## 9.2. 未解決の課題

| 課題 | 影響度 | 対応方針 |
|------|--------|----------|
| git CLI (tokio::process::Command) の `worktree list --porcelain` サポート状況 | 中 | git CLI (tokio::process::Command) が直接サポートしない場合は `git.raw()` で生コマンドを実行し、出力をパースする |
| notify + notify-debouncer-full の Tauri 2.x + Vite 6 との互換性 | 中 | 実装時に検証。問題がある場合は Node.js 標準の `fs.watch` + 自前デバウンスを代替案とする |
| ワークツリー数が多い場合（50超）のパフォーマンス | 低 | 初期は50以下を想定。超過時は仮想スクロール + dirty チェックの遅延実行を検討 |
| detached HEAD 状態のワークツリーの表示方法 | 低 | ブランチ名の代わりに HEAD の短縮 SHA を表示。UI 上で視覚的に区別可能にする |
| RefreshWorktreesUseCase の repoPath 取得方法 | 中 | application-foundation の RepositoryService（currentRepository$）から repoPath を取得する。feature 間依存は shared インターフェース経由で解決し、直接参照は避ける。実装時に DI 設計を確定する |
| ConsumerUseCase の非同期エラーハンドリング方針 | 低 | `invoke()` が `void` を返す UseCase では、Promise の reject を ViewModel 側または ErrorNotificationService 経由でハンドリングする。application-foundation の OpenRepositoryUseCase パターンを参考にする |

---

# 10. 変更履歴

## v5.0 (2026-04-11)

**FR_102_05 / FR_103_05 / FR_106 の設計追加**

- impl-status を `implemented` → `in-progress` に変更
- 実装進捗テーブルに新規モジュール 10件（🔴 未実装）を追加
- 技術スタックに `glob` crate、shadcn/ui Combobox を追加
- モジュール分割表に SymlinkService、SymlinkConfigRepository、BranchCombobox 等を追加
- 共有型に SymlinkConfig、SymlinkResult、BranchDeleteResult、WorktreeCreateResult を追加
- 設計判断に 8件の決定事項を追加（ブランチ選択UI、ブランチ削除方式、シンボリックリンク設定保存先、glob crate 選定等）

**FR_102_05: ブランチ選択UI**
- BranchCombobox 共通コンポーネント（`src/components/branch-combobox.tsx`）を WorktreeCreateDialog で使用
- infrastructure 層の Repository 経由で `git_branches` IPC を呼び出し（A-004 準拠）

**FR_103_05: ブランチ同時削除**
- DeleteWorktreeMainUseCase を拡張し `worktree_delete` 内で一括実行（worktree remove → branch -d → 未マージ時 BranchDeleteResult 返却）
- WorktreeDeleteDialog にチェックボックス追加（デフォルト ON、他WT使用中は disabled）

**FR_106: シンボリックリンク**
- SymlinkService（application 層）+ SymlinkConfigRepository（infrastructure 層）を新設
- CreateWorktreeMainUseCase 内で SymlinkService を呼び出し自動作成
- 設定管理UIは application-foundation の Settings にセクション追加
- WorktreeCreateDialog にパターン確認表示を追加

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

## v1.3 (2026-03-29)

**変更内容:**

- [FIX-023] Tauri Core (Rust)側 di-tokens で UseCase IF 型を `FunctionUseCase` の型エイリアスとして定義（具象クラスからの import を排除）
- [FIX-024] メインプロセス側 DI Config を `useClass + deps` パターンに統一（ファクトリー関数を排除）
- [FIX-025] Webview 側 DI Config を `useClass + deps` パターンに統一（RefreshWorktreesUseCase はコールバック引数があるためファクトリー関数を維持）
- [FIX-026] ViewModel から Service 直参照を排除（GetSelectedPathUseCase, SetSortOrderUseCase を追加し UseCase 経由に統一）
- [FIX-027] WorktreeDetailViewModel 簡素化（worktreeStatus$/refreshStatus() を削除、selectedWorktree$ のみ）
- [FIX-028] WorktreeService の Observable 公開方法を getter から constructor フィールド化に変更（参照安定性のため）
- [FIX-029] IPC Handlers の import を具象 UseCase ファイルから `di-tokens` の型エイリアスに変更
- [FIX-030] WorktreeService の配置パスを `application/worktree-service.ts` から `application/services/worktree-service.ts` に修正

## v1.2 (2026-03-27)

**変更内容:**

- [FIX-011] Tauri Core (Rust)側 WorktreeMainUseCase を7つの個別 UseCase クラスに分割（FunctionUseCase パターン統一）
- [FIX-012] Tauri Core (Rust)側 DI Tokens を7つの個別 UseCase Token に更新
- [FIX-013] Tauri Core (Rust)側 DI Config を7つの個別 UseCase 登録に更新
- [FIX-014] IPC Handlers を7つの個別 UseCase パラメータ受け取りに更新、各ハンドラーで `useCase.invoke()` 呼び出しに統一
- [FIX-015] `worktree:default-branch` IPC チャネルを追加（GetDefaultBranchMainUseCase）
- [FIX-016] WorktreeGitRepository に `getDefaultBranch()` メソッドを追加
- [FIX-017] Tauri invoke/listen API / IPCChannelMap / ElectronAPI に `defaultBranch` を追加
- [FIX-018] Webview 側 DI Config に RepositoryService.currentRepository$ 購読パターンを追加（リポジトリ変更時の自動読み込み）
- [FIX-019] RefreshWorktreesUseCase に `getRepoPath` コールバック（RepositoryService 連携）を追加
- [FIX-020] WorktreeListViewModel のコンストラクタに WorktreeService パラメータを追加（setSortOrder, selectedPath$ 用）
- [FIX-021] システム構成図のTauri Core (Rust) Application 層を個別 UseCase 表記に更新
- [FIX-022] 実装進捗テーブルを7つの個別 UseCase に更新

## v1.1 (2026-03-27)

**変更内容:**

- [FIX-001] モジュール分割・ディレクトリ構造を Clean Architecture 4層構成（A-004）に準拠
- [FIX-002] DI 設計セクション追加（Main/Renderer 両側の tokens, di-config）
- [FIX-003] Webview 側 Clean Architecture 設計を追加（Service, UseCases, Repository, ViewModel, Hooks）
- [FIX-004] WorktreeWatcher のライフサイクルを明確化（setUp/tearDown 連動）
- [FIX-005] Preload 統合方法を明確化（単一 electronAPI オブジェクトへの追加）
- [FIX-006] checkDirty の worktreePath のみ引数設計の根拠を追記
- [FIX-007] WorktreeDetail のスコープを明確化（基本情報のみ、詳細は repository-viewer）
- [FIX-008] SortOrder 'last-updated' の定義を追記（= latest commit author date）
- [FIX-009] テスト戦略に Vitest + Testing Library を明記
- [FIX-010] RxJS リアクティブデータフローの設計を追加（FIX-003 に含む）

## v1.0 (2026-03-25)

**変更内容:**

- 初版作成
- WorktreeService、WorktreeWatcher、IPC ハンドラー、React コンポーネントの設計を定義
- git CLI (tokio::process::Command) + notify + notify-debouncer-full の技術選定
- テスト戦略の策定
