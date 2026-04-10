---
id: "design-application-foundation"
title: "アプリケーション基盤"
type: "design"
status: "approved"
sdd-phase: "plan"
impl-status: "implemented"
created: "2026-03-25"
updated: "2026-04-10"
depends-on: [ "spec-application-foundation" ]
tags: [ "foundation", "ipc", "tauri", "tauri-migration", "error-handling", "clean-architecture", "di", "rxjs" ]
category: "infrastructure"
priority: "high"
risk: "high"
---

# アプリケーション基盤

**関連 Spec:** [application-foundation_spec.md](./application-foundation_spec.md)
**関連 PRD:** [application-foundation.md](../requirement/application-foundation.md)

---

# 1. 実装ステータス

**ステータス:** 🟢 実装済み

> v3 時代の Electron 実装は変更履歴に凍結済み。Tauri 2 + Rust への移行が完了し、`src/features/application-foundation/` (Webview) および `src-tauri/src/features/application_foundation/` (Rust) にコードが存在する。

## 1.1. 実装進捗

| モジュール/機能                                     | Electron (v3 凍結) | Tauri (v4 ターゲット)                                                                                                    |
|----------------------------------------------|-------------------|---------------------------------------------------------------------------------------------------------------------|
| DI コンテナ登録 (Webview)                          | 🟢                | 🟢 VContainerConfig は維持、パスを `src/features/application-foundation/` に更新                                                |
| DI コンテナ登録 (Rust)                             | -                 | 🟢 `AppState::new(app_handle)` + `tauri::Builder::manage`                                                            |
| domain 層（TypeScript エンティティ）                  | 🟢                | 🟢 `src/shared/domain/` に移動                                                                                          |
| domain 層（Rust struct）                        | -                 | 🟢 `src-tauri/src/features/application_foundation/domain.rs` に serde 付きで定義                                            |
| application 層（UseCase / Service, TS）         | 🟢                | 🟢 Webview 側はそのまま維持                                                                                                 |
| application 層（UseCase / Rust trait）          | -                 | 🟢 `src-tauri/src/features/application_foundation/application/`                                                      |
| infrastructure 層（Webview Repository）         | 🟢                | 🟢 `invoke()` 直呼びに書き換え                                                                                              |
| infrastructure 層（Rust Repository impl）      | -                 | 🟢 `tauri-plugin-store` / `tauri-plugin-dialog` / `tokio::process::Command` 経由                                        |
| presentation 層（ViewModel）                    | 🟢                | 🟢 Webview 側はそのまま維持                                                                                                 |
| presentation 層（Hook ラッパー）                   | 🟢                | 🟢 Webview 側は維持（`listenEvent` 購読を async 対応）                                                                        |
| presentation 層（React コンポーネント）              | 🟢                | 🟢 Webview 側は維持                                                                           |
| presentation 層（Rust `#[tauri::command]`）    | -                 | 🟢 10 コマンド（`repository_*`, `settings_*`）を実装済み                                                                        |

---

# 2. 設計目標

1. **型安全な IPC 通信基盤** — すべての IPC チャネルに TypeScript 型定義を提供し、コンパイル時にエラーを検出する
2. **Tauri セキュリティ準拠** — 型安全な invoke/listen ラッパー パターンを徹底し、Webviewから Node.js API に直接アクセスしない（原則
   A-001, T-003）
3. **Clean Architecture による関心の分離** — 4層構成で依存方向を一方向に制約し、テスタビリティと保守性を確保する（原則
   A-004）
4. **DI コンテナによる依存関係管理** — VContainer で UseCase / Service / Repository の依存を注入し、疎結合を実現する（原則
   A-003）
5. **RxJS による非同期データフロー** — Observable パターンでリアクティブな状態管理を行う（原則 A-006）
6. **MVVM パターン** — ViewModel（純粋 TypeScript）+ Hook ラッパーで React と分離し、ViewModel の単体テストを容易にする
7. **永続化の統一** — 設定・履歴データを tauri-plugin-store で一元管理し、アプリ再起動後も状態を保持する
8. **エラーの統一ハンドリング** — IPC 通信エラーを `IPCResult<T>` 型で統一し、Webview 側で一貫したエラー表示を行う

---

# 3. 技術スタック

> 以下はプロジェクト共通の技術スタックです。機能固有の追加技術のみ記載してください。

| 領域     | 採用技術                      | 選定理由                                                         |
|--------|---------------------------|--------------------------------------------------------------|
| データ永続化 | tauri-plugin-store            | Tauri 向け JSON ベースの KV ストア。型安全な API、スキーマバリデーション付き |
| トースト通知 | Sonner                    | Shadcn/ui 推奨のトーストライブラリ。Tailwind CSS との親和性が高い                 |
| リアクティブ | RxJS 7.8                  | A-006 準拠。Observable ベースの非同期データフロー                            |
| DI     | VContainer (`src/shared/lib/di`) | A-003 準拠。プロジェクト内製の軽量 DI コンテナ                                 |

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
        subgraph "presentation"
            Components[React Components]
            Hooks[Hook Wrappers<br/>useXxxViewModel]
            ViewModels[ViewModels<br/>純粋 TypeScript]
            Components --> Hooks
            Hooks --> ViewModels
        end
        subgraph "application"
            UseCases[UseCases<br/>ステートレス]
            Services[Services<br/>ステートフル / BehaviorSubject]
            RepoIF["Repository IF"]
            ViewModels --> UseCases
            UseCases --> Services
            UseCases --> RepoIF
        end
        subgraph "domain"
            Entities[Entities<br/>RepositoryInfo, AppSettings 等]
        end
        subgraph "infrastructure (renderer)"
            RepoDefault[Repository Default]
            IPCClient["IPC Client<br/>invokeCommand / listenEvent ラッパー"]
            RepoIF -.->|DI| RepoDefault
            RepoDefault --> IPCClient
        end
        UseCases --> Entities
        Services --> Entities
    end

    subgraph "Tauri Runtime"
        Runtime["Tauri Runtime<br/>(Webview ↔ Core IPC)"]
    end

    subgraph "Main Process"
        subgraph "infrastructure (main)"
            IPCHandler[IPC Handlers<br/>#[tauri::command]]
            MainServices[Main Services<br/>Git 検証 / ストア操作]
            Store[tauri-plugin-store]
            IPCHandler --> MainServices
            MainServices --> Store
        end
    end

    IPCClient -->|" invoke "| Runtime
    Runtime -->|" invoke "| IPCHandler
    IPCHandler -->|" response "| Bridge
    Runtime -->|" result "| IPCClient
```

## 4.2. モジュール分割

### Webview 側（Clean Architecture 4層）

| モジュール名                                        | 層              | 責務                     | 配置場所                                                                |
|-----------------------------------------------|----------------|------------------------|---------------------------------------------------------------------|
| RepositoryInfo, RecentRepository, AppSettings | domain         | エンティティ・型定義             | `src/shared/domain/`                                                       |
| RepositoryRepository (IF)                     | application    | リポジトリアクセス IF           | `src/features/application-foundation/application/`             |
| SettingsRepository (IF)                       | application    | 設定アクセス IF              | `src/features/application-foundation/application/`             |
| RepositoryService                             | application    | リポジトリ状態管理（ステートフル）      | `src/features/application-foundation/application/`             |
| SettingsService                               | application    | 設定状態管理（ステートフル）         | `src/features/application-foundation/application/`             |
| ErrorNotificationService                      | application    | エラー通知状態管理（ステートフル）      | `src/features/application-foundation/application/`             |
| OpenRepositoryUseCase                         | application    | リポジトリオープン（ダイアログ経由）     | `src/features/application-foundation/application/`             |
| OpenRepositoryByPathUseCase                   | application    | パス指定でリポジトリオープン         | `src/features/application-foundation/application/`             |
| GetRecentRepositoriesUseCase                  | application    | 最近のリポジトリ取得             | `src/features/application-foundation/application/`             |
| RemoveRecentRepositoryUseCase                 | application    | 最近のリポジトリ削除             | `src/features/application-foundation/application/`             |
| PinRepositoryUseCase                          | application    | リポジトリのピン留め             | `src/features/application-foundation/application/`             |
| GetCurrentRepositoryUseCase                   | application    | 現在のリポジトリ取得（Observable） | `src/features/application-foundation/application/`             |
| GetSettingsUseCase                            | application    | 設定取得                   | `src/features/application-foundation/application/`             |
| UpdateSettingsUseCase                         | application    | 設定更新                   | `src/features/application-foundation/application/`             |
| GetErrorNotificationsUseCase                  | application    | エラー通知取得（Observable）    | `src/features/application-foundation/application/`             |
| DismissErrorUseCase                           | application    | エラー通知の非表示              | `src/features/application-foundation/application/`             |
| RetryErrorUseCase                             | application    | エラー操作の再試行              | `src/features/application-foundation/application/`             |
| RepositoryDefaultRepository                   | infrastructure | IPC 経由のリポジトリ実装         | `src/features/application-foundation/infrastructure/`          |
| SettingsDefaultRepository                     | infrastructure | IPC 経由の設定実装            | `src/features/application-foundation/infrastructure/`          |
| RepositorySelectorViewModel                   | presentation   | リポジトリ選択 ViewModel      | `src/features/application-foundation/presentation/`            |
| SettingsViewModel                             | presentation   | 設定 ViewModel           | `src/features/application-foundation/presentation/`            |
| ErrorNotificationViewModel                    | presentation   | エラー通知 ViewModel        | `src/features/application-foundation/presentation/`            |
| useRepositorySelectorViewModel                | presentation   | Hook ラッパー              | `src/features/application-foundation/presentation/`            |
| useSettingsViewModel                          | presentation   | Hook ラッパー              | `src/features/application-foundation/presentation/`            |
| useErrorNotificationViewModel                 | presentation   | Hook ラッパー              | `src/features/application-foundation/presentation/`            |
| RepositorySelectorDialog                      | presentation   | リポジトリ選択ダイアログ（React）    | `src/features/application-foundation/presentation/components/` |
| RecentRepositoriesList                        | presentation   | 最近のリポジトリ一覧（React）      | `src/features/application-foundation/presentation/components/` |
| SettingsDialog                                | presentation   | 設定ダイアログ（React）         | `src/features/application-foundation/presentation/components/` |
| ErrorNotificationToast                        | presentation   | エラー通知トースト（React）       | `src/features/application-foundation/presentation/components/` |
| AppLayout                                     | presentation   | メインレイアウト（React）        | `src/components/layout/`                                       |
| MainHeader                                    | presentation   | ヘッダーコンポーネント（React）     | `src/components/layout/`                                       |
| ThemeProvider                                 | presentation   | テーマ切り替えプロバイダー（React）   | `src/components/`                                              |

> **注記**: Tauri Core (Rust) 側の DI は `tauri::State<AppState>` + `Arc<dyn Trait>` パターンで実装。以下の TypeScript 風コード例は仕様の概要を示すものであり、実装は Rust で行われている。

### Tauri Core (Rust)側（Clean Architecture 4層構成）

| モジュール名                              | 層              | 責務                                | 配置場所                                                   |
|-------------------------------------|----------------|-----------------------------------|--------------------------------------------------------|
| RepositoryInfo, AppSettings 等       | domain         | エンティティ（プロセス間共有）                   | `src/shared/domain/`                                          |
| IPC Handlers (commands.rs)          | presentation   | IPC チャネルの受付・ルーティング（Controller 相当） | `src-tauri/src/features/application_foundation/presentation/commands.rs`   |
| OpenRepositoryWithDialogMainUseCase | application    | ダイアログ経由のリポジトリオープン                 | `src-tauri/src/features/application_foundation/application/`    |
| OpenRepositoryByPathMainUseCase     | application    | パス指定でリポジトリオープン                    | `src-tauri/src/features/application_foundation/application/`    |
| ValidateRepositoryMainUseCase       | application    | リポジトリの検証                          | `src-tauri/src/features/application_foundation/application/`    |
| GetRecentRepositoriesMainUseCase    | application    | 最近のリポジトリ取得                        | `src-tauri/src/features/application_foundation/application/`    |
| RemoveRecentRepositoryMainUseCase   | application    | 最近のリポジトリ削除                        | `src-tauri/src/features/application_foundation/application/`    |
| PinRepositoryMainUseCase            | application    | リポジトリのピン留め                        | `src-tauri/src/features/application_foundation/application/`    |
| GetSettingsMainUseCase              | application    | 設定取得                              | `src-tauri/src/features/application_foundation/application/`    |
| UpdateSettingsMainUseCase           | application    | 設定更新                              | `src-tauri/src/features/application_foundation/application/`    |
| GetThemeMainUseCase                 | application    | テーマ取得                             | `src-tauri/src/features/application_foundation/application/`    |
| SetThemeMainUseCase                 | application    | テーマ設定                             | `src-tauri/src/features/application_foundation/application/`    |
| StoreDefaultRepository              | infrastructure | tauri-plugin-store データアクセス            | `src-tauri/src/features/application_foundation/infrastructure/` |
| GitValidationDefaultRepository      | infrastructure | tokio::process::Command による Git 検証               | `src-tauri/src/features/application_foundation/infrastructure/` |
| DialogDefaultRepository             | infrastructure | tauri-plugin-dialog 経由のネイティブダイアログ               | `src-tauri/src/features/application_foundation/infrastructure/` |

### プロセス間共有

| モジュール名      | 責務                                    | 配置場所                               |
|-------------|---------------------------------------|------------------------------------|
| Domain 型    | エンティティ（RepositoryInfo, AppSettings 等） | `src/shared/domain/`                      |
| IPC 型定義     | IPC チャネルの型定義                          | `src/shared/lib/ipc.ts`                   |
| Tauri invoke/listen API | 型安全な  API 公開              | （preload 層は Tauri では不要） |

---

# 5. データモデル

```typescript
// tauri-plugin-store スキーマ
interface StoreSchema {
    recentRepositories: RecentRepository[];
    settings: AppSettings;
}

// デフォルト値
const storeDefaults: StoreSchema = {
    recentRepositories: [],
    settings: {
        theme: 'system',
        gitPath: null,
        defaultWorkDir: null,
    },
};
```

---

# 6. インターフェース定義

## 6.1. DI コンテナ登録

```typescript
// src/features/application-foundation/di-config.ts（目標パス）
import type {VContainerConfig} from '@/shared/lib/di'

export const applicationFoundationConfig: VContainerConfig = {
    register: (container) => {
        // Service（ステートフル）
        container.registerSingleton(RepositoryServiceToken, RepositoryService)
        container.registerSingleton(SettingsServiceToken, SettingsService)
        container.registerSingleton(ErrorNotificationServiceToken, ErrorNotificationService)

        // Repository 実装（infrastructure → application IF を DI）
        container.registerSingleton(RepositoryRepositoryToken, RepositoryDefaultRepository)
        container.registerSingleton(SettingsRepositoryToken, SettingsDefaultRepository)

        // UseCase（ステートレス）
        container.registerSingleton(
            OpenRepositoryUseCaseToken,
            OpenRepositoryDefaultUseCase,
            [RepositoryRepositoryToken, RepositoryServiceToken],
        )
        container.registerSingleton(
            GetRecentRepositoriesUseCaseToken,
            GetRecentRepositoriesDefaultUseCase,
            [RepositoryServiceToken],
        )
        container.registerSingleton(
            GetSettingsUseCaseToken,
            GetSettingsDefaultUseCase,
            [SettingsServiceToken],
        )
        container.registerSingleton(
            UpdateSettingsUseCaseToken,
            UpdateSettingsDefaultUseCase,
            [SettingsRepositoryToken, SettingsServiceToken],
        )

        // ViewModel（transient: コンポーネント単位でライフサイクル管理）
        container.registerTransient(
            RepositorySelectorViewModelToken,
            RepositorySelectorDefaultViewModel,
            [OpenRepositoryUseCaseToken, GetRecentRepositoriesUseCaseToken],
        )
        container.registerTransient(
            SettingsViewModelToken,
            SettingsDefaultViewModel,
            [GetSettingsUseCaseToken, UpdateSettingsUseCaseToken],
        )
    },
    setUp: async (container) => {
        // 初期データのロード（設定・履歴を IPC 経由で取得してサービスに反映）
        const settingsRepo = container.resolve(SettingsRepositoryToken)
        const settingsService = container.resolve(SettingsServiceToken)
        const settings = await settingsRepo.get()
        settingsService.updateSettings(settings)

        const repoRepo = container.resolve(RepositoryRepositoryToken)
        const repoService = container.resolve(RepositoryServiceToken)
        const recent = await repoRepo.getRecent()
        repoService.updateRecentRepositories(recent)

        return () => {
            // tearDown: BehaviorSubject の complete 等
        }
    },
}
```

## 6.2. UseCase / Service 実装パターン

```typescript
// Service（ステートフル）— application 層
class RepositoryService {
    private readonly _currentRepository$ = new BehaviorSubject<RepositoryInfo | null>(null)
    private readonly _recentRepositories$ = new BehaviorSubject<RecentRepository[]>([])

    get currentRepository$(): Observable<RepositoryInfo | null> {
        return this._currentRepository$.asObservable()
    }

    get recentRepositories$(): Observable<RecentRepository[]> {
        return this._recentRepositories$.asObservable()
    }

    setCurrentRepository(repo: RepositoryInfo | null): void {
        this._currentRepository$.next(repo)
    }

    updateRecentRepositories(repos: RecentRepository[]): void {
        this._recentRepositories$.next(repos)
    }
}

// UseCase（ステートレス）— application 層
class OpenRepositoryDefaultUseCase implements RunnableUseCase {
    constructor(
        private readonly repo: RepositoryRepository,
        private readonly service: RepositoryService,
    ) {
    }

    invoke(): void {
        this.repo.open().then((result) => {
            if (result) {
                this.service.setCurrentRepository(result)
                // 履歴更新
                this.repo.getRecent().then((recent) => {
                    this.service.updateRecentRepositories(recent)
                })
            }
        })
    }
}

// UseCase（ステートレス、Observable 公開）— application 層
class GetRecentRepositoriesDefaultUseCase implements ObservableStoreUseCase<RecentRepository[]> {
    constructor(private readonly service: RepositoryService) {
    }

    get store(): Observable<RecentRepository[]> {
        return this.service.recentRepositories$
    }
}
```

## 6.3. ViewModel + Hook パターン

```typescript
// ViewModel（純粋 TypeScript、React 非依存）— presentation 層
class RepositorySelectorDefaultViewModel implements RepositorySelectorViewModel {
    constructor(
        private readonly openRepoUseCase: OpenRepositoryUseCase,
        private readonly getRecentUseCase: GetRecentRepositoriesUseCase,
    ) {
    }

    get recentRepositories$(): Observable<RecentRepository[]> {
        return this.getRecentUseCase.store
    }

    openWithDialog(): void {
        this.openRepoUseCase.invoke()
    }
}

// Hook ラッパー（Observable → React state）— presentation 層
function useRepositorySelectorViewModel() {
    const vm = useResolve(RepositorySelectorViewModelToken)
    const recentRepositories = useObservable(vm.recentRepositories$, [])

    return {
        recentRepositories,
        openWithDialog: vm.openWithDialog.bind(vm),
    }
}
```

## 6.4. Infrastructure 層（IPC 通信）

```typescript
// Repository 実装（infrastructure 層、Webview 側）
class RepositoryDefaultRepository implements RepositoryRepository {
    async open(): Promise<RepositoryInfo | null> {
        const result = await invokeCommand<T>('repository_open'()
        if (!result.success) throw new Error(result.error.message)
        return result.data
    }

    async getRecent(): Promise<RecentRepository[]> {
        const result = await invokeCommand<T>('repository_get_recent'()
        if (!result.success) throw new Error(result.error.message)
        return result.data
    }

    // ... 他のメソッド
}
```

> **注記**: 実装では Rust の `#[tauri::command]` マクロで各コマンドを定義し、`lib.rs` の `invoke_handler!` で一括登録している。

```typescript
// IPC ハンドラー（infrastructure 層、Tauri Core (Rust)側）
export function registerIPCHandlers(
    repoService: RepositoryMainService,
    settingsService: SettingsMainService,
): void {
    #[tauri::command]('repository:open', async (): Promise<IPCResult<RepositoryInfo>> => {
        return repoService.openWithDialog()
    })

    #[tauri::command]('settings:get', async (): Promise<IPCResult<AppSettings>> => {
        return settingsService.getAll()
    })

    // ... 他のハンドラー
}
```

---

# 7. 非機能要件実現方針

| 要件                       | 実現方針                                                           |
|--------------------------|----------------------------------------------------------------|
| 起動3秒以内 (NFR_001)         | VContainerProvider の setUp で非同期初期化。UI は setUp 完了前に fallback 表示 |
| IPC 50ms以内 (NFR_002)     | 軽量な JSON シリアライズ、バッチ処理は行わず単一リクエスト/レスポンス                         |
| Tauri セキュリティ (DC_001) | CSP 設定 (Tauri), capabilities 最小化 (Tauri), Tauri セキュリティ設定 (capabilities / CSP) 設定 |
| データ永続化 (DC_002)          | tauri-plugin-store でローカルファイルに JSON 保存                              |

---

# 8. テスト戦略

| テストレベル  | 対象                                   | 層                          | カバレッジ目標  |
|---------|--------------------------------------|----------------------------|----------|
| ユニットテスト | UseCase, Service                     | application                | ≥ 80%    |
| ユニットテスト | ViewModel（Observable テスト）            | presentation               | ≥ 80%    |
| ユニットテスト | Repository Default（モック IPC）          | infrastructure             | ≥ 80%    |
| 結合テスト   | ViewModel + UseCase + モック Repository | application + presentation | 主要フロー    |
| E2Eテスト  | 画面操作フロー                              | 全層                         | 主要ユースケース |

**テスト方針**:

- domain / application 層のテストは React / Tauri 環境不要（純粋 TypeScript テスト）
- ViewModel のテストは Observable の emit 値を検証（React 不要）
- Hook ラッパーのテストは `@testing-library/react` の `renderHook` を使用
- infrastructure 層のテストは tauri-plugin-store / tauri-plugin-dialog の Mock Repository を使用

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項                  | 選択肢                                       | 決定内容                                      | 理由                                                                                                                               |
|-----------------------|-------------------------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| データ永続化ライブラリ           | tauri-plugin-store / lowdb / SQLite           | tauri-plugin-store                            | Tauri 向けに最適化。型安全な API 付き。KV ストアで十分な要件                                                                                 |
| IPC レスポンス型            | 生の値返却 / Result 型                          | `IPCResult<T>` 型（Result パターン）             | エラーハンドリングの統一。Webview 側で一貫したエラー処理が可能（原則 T-002）                                                                                       |
| トースト通知ライブラリ           | react-hot-toast / react-toastify / Sonner | Sonner                                    | Shadcn/ui 推奨。Tailwind CSS との親和性が高い（原則 A-002）                                                                                     |
| テーマ管理                 | CSS 変数 / Tailwind dark mode / next-themes | Tailwind CSS dark mode + CSS 変数           | Shadcn/ui のテーマ機構と統合。system テーマは `prefers-color-scheme` メディアクエリ                                                                   |
| IPC チャネル命名            | フラット / 名前空間                               | 名前空間方式 (`domain:action`)                  | チャネル数増加時の管理性。ドメインごとのグルーピング                                                                                                       |
| Tauri Core (Rust)の層構成           | 4層 / infrastructure のみ                    | **4層構成**                                  | Tauri Core (Rust)にも Git 検証・履歴管理等のビジネスロジックが存在するため4層構成を適用。IPC Handler = presentation、UseCase = application、tauri-plugin-store 等 = infrastructure |
| プロセス別ディレクトリ分離         | feature 内 / プロセス別                         | **プロセス別**                                 | `src-tauri/src/`, `src/`, `src/` に分離。ビルド境界と一致し、プロセス間の不正な依存を防止                                            |
| ViewModel の DI ライフタイム | singleton / transient                     | transient                                 | コンポーネント単位でライフサイクルを管理。画面遷移時に自動的に新しいインスタンスが作成される                                                                                   |
| テーマ切り替え方式             | CSS 変数 / class 切り替え                       | `<html>` の `class="dark"` 切り替え            | Tailwind CSS dark mode が class 戦略を使用。system 連動は `window.matchMedia('prefers-color-scheme: dark')` で検出                            |
| トースト通知の実装方式           | コンポーネント描画 / API 呼び出し                      | Sonner の `toast()` API を useEffect 内で呼び出し | コンポーネント自体は null を返し、notifications の変更を監視して toast() を発火                                                                           |
| リポジトリリストのソート順         | アクセス日時 / ピン留め優先                           | ピン留め優先 → 最終アクセス日時降順                       | ピン留めリポジトリを上位表示し、頻繁に使うリポジトリへのアクセス性を向上                                                                                             |
| リポジトリ選択ダイアログの初期表示     | 手動オープン / 自動オープン                           | アプリ起動時に自動オープン（`open={true}`）              | currentRepository が null の場合、ユーザーは操作できないためオンボーディングとして表示                                                                          |

## 9.2. 未解決の課題

| 課題                                         | 影響度 | 対応方針                                                                                                                                                |
|--------------------------------------------|-----|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| tauri-plugin-store の Vite 6 との ESM 互換性         | 低   | ✅ 検証済み。Vite 6 + Tauri CLI 環境で正常動作を確認                                                                                                           |
| 大量の IPC チャネル定義の管理方法                        | 低   | 初期は手動定義。チャネル数が増えた段階でコード生成を検討                                                                                                                        |
| RxJS Subscription のメモリリーク防止                | 中   | VContainerProvider の tearDown + DisposableStack で一括管理                                                                                               |
| RepositorySelectorViewModel の Service 直接参照 | 低   | currentRepository$ を公開する専用 UseCase が未定義のため、ViewModel が RepositoryService を直接参照。di-tokens.ts の IF 定義経由で疎結合は維持。必要に応じて GetCurrentRepositoryUseCase を追加 |
| IPC ハンドラーの入力バリデーション                        | 低   | 現状は preload 経由の型付き API のみ（内部通信）のため未実装。将来的にバリデーションミドルウェアの追加を検討                                                                                       |
| Tauri Core (Rust) UseCase のユニットテスト                   | 低   | ✅ 解決済み。RepositoryMainUseCase（13テスト）、SettingsMainUseCase（5テスト）を作成                                                                                    |
| ドキュメント移行注記の削除                              | 低   | ✅ 解決済み。design.md, CONSTITUTION.md の移行注記を削除                                                                                                          |

---

# 10. 変更履歴

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

## v3.0 (2026-03-26)

**変更内容:**

- プロセス別ディレクトリ分離を設計方針として決定（`src-tauri/src/`, `src/`, `src/`,
  `(削除: Tauri では preload 不要)`）
- Tauri Core (Rust)側にも Clean Architecture 4層構成を適用
    - presentation: IPC Handler（Controller 相当）
    - application: UseCase（Git 検証、履歴管理ビジネスルール）
    - infrastructure: tauri-plugin-store, execFile, dialog
    - domain: shared/ から参照
- Tauri Core (Rust)でも VContainer を使用（container API）
- IPC の層の位置づけを明確化（Webview 側 = infrastructure、Tauri Core (Rust)側 = presentation）
- 設計判断「Tauri Core (Rust)は infrastructure のみ」を「4層構成」に変更

## v2.1 (2026-03-26)

**変更内容:**

- React コンポーネント実装完了（presentation 層）
    - RepositorySelectorDialog: リポジトリ選択ダイアログ
    - RecentRepositoriesList: 最近開いたリポジトリ一覧
    - SettingsDialog: 設定ダイアログ（テーマ、Git パス、デフォルトディレクトリ）
    - ErrorNotificationToast: エラー通知トースト（Sonner）
    - AppLayout: メインレイアウト
    - MainHeader: ヘッダーコンポーネント
    - ThemeProvider: テーマ切り替え（light/dark/system）
- コンポーネントテスト追加（186 テスト全てパス）
- アクセシビリティ対応（ARIA 属性、キーボードナビゲーション）
- tauri-plugin-store の ESM 互換性を検証・確認

## v2.0

**変更内容:**

- Clean Architecture 4層構成に全面改定（A-004）
- DI コンテナ（VContainer）による依存関係管理を追加（A-003）
- UseCase（ステートレス）/ Service（ステートフル）パターンを導入
- ViewModel + Hook ラッパーによる MVVM パターンを導入
- RxJS Observable による非同期データフローを追加（A-006）
- モジュール分割を `src/features/application-foundation/` 配下の4層構成に変更
- テスト戦略を層ごとに再定義
- Tauri Core (Rust)側は infrastructure 層のみとする設計判断を追加

## v1.0

**変更内容:**

- 初版作成
- IPC 通信基盤、リポジトリ管理、設定管理、エラーハンドリングの設計を定義
