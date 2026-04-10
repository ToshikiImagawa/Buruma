---
id: "spec-application-foundation"
title: "アプリケーション基盤"
type: "spec"
status: "approved"
sdd-phase: "specify"
created: "2026-03-25"
updated: "2026-04-09"
depends-on: ["prd-application-foundation"]
tags: ["foundation", "ipc", "tauri", "error-handling", "clean-architecture", "di", "rxjs", "tauri-migration"]
category: "infrastructure"
priority: "high"
risk: "high"
---

# アプリケーション基盤

**関連 Design Doc:** [application-foundation_design.md](./application-foundation_design.md)
**関連 PRD:** [application-foundation.md](../requirement/application-foundation.md)

---

# 1. 背景

Buruma は複数のワークツリーを並行管理する Git GUI アプリケーションである。すべての機能（ワークツリー管理、リポジトリ閲覧、Git 操作、Claude Code 連携）が共通して依存する基盤レイヤーとして、リポジトリ管理、アプリケーション設定、IPC 通信基盤、エラーハンドリングが必要である。

本仕様は PRD [application-foundation.md](../requirement/application-foundation.md) の要求（UR_001〜UR_005, FR_601〜FR_605, NFR_001〜NFR_002, DC_001〜DC_002）を実現するための論理設計を定義する。

# 2. 概要

アプリケーション基盤は以下の4つのサブシステムで構成される：

1. **リポジトリ管理** — ローカル Git リポジトリの選択・オープン・履歴管理（FR_601, FR_602）
2. **アプリケーション設定** — テーマ、Git パス等のユーザー設定管理（FR_603）
3. **IPC 通信基盤** — Tauri invoke / emit による型安全な通信レイヤー（FR_604）
4. **エラーハンドリング** — 統一的なエラー通知・リカバリ機能（FR_605）

すべてのサブシステムは Tauri のアーキテクチャ（Webview / Tauri Core）に準拠し、DC_001（IPC セキュリティ制約）を遵守する。

## アーキテクチャ概要

本 feature は Clean Architecture 4層構成（A-004）に従い、Webview 側は `src/features/application-foundation/`、Tauri Core (Rust) 側は `src-tauri/src/features/application_foundation/` に実装する。domain 型は `src/shared/domain/`（TypeScript）に配置し、Rust 側は `src-tauri/src/domain/` で serde 付き struct として整合させる。

```
domain ← application ← infrastructure
                     ← presentation
```

**Webview 側 (TypeScript)**:

| 層 | 責務 |
|:---|:---|
| **domain** | エンティティ（`src/shared/domain/` から境界間共有） |
| **application** | UseCase（ステートレス）、Service（ステートフル）、リポジトリ IF |
| **infrastructure** | リポジトリ実装（Tauri invoke クライアント経由で Tauri Core と通信） |
| **presentation** | ViewModel（純粋 TypeScript クラス）、Hook ラッパー、React コンポーネント |

**Tauri Core 側 (Rust)**:

| 層 | 責務 |
|:---|:---|
| **domain** | エンティティ（`src-tauri/src/domain/` の serde 付き struct） |
| **application** | UseCase（Git 検証、履歴管理等のビジネスルール）、Repository trait |
| **infrastructure** | `tauri-plugin-store` / `tauri-plugin-dialog` / `tokio::process::Command` 経由のネイティブ API ラッパー |
| **presentation** | `#[tauri::command]` 関数（リクエスト受付・ルーティング、Controller に相当） |

Webview 側のビジネスロジック（domain / application 層）は純粋な TypeScript で実装し（A-005）、非同期データフローには RxJS を使用する（A-006）。Tauri Core 側のビジネスロジックは純粋な Rust で実装する（A-007）。Webview の依存関係は VContainer（A-003）、Tauri Core の依存関係は `tauri::State<T>` + `Arc<dyn Trait>` で注入する。

# 3. 要求定義

## 3.1. 機能要件 (Functional Requirements)

| ID | 要件 | 優先度 | 根拠 (PRD) |
|--------|------|------|------|
| FR-001 | ネイティブフォルダ選択ダイアログでローカルリポジトリを開く | 必須 | FR_601 |
| FR-002 | 選択フォルダが有効な Git リポジトリかを検証する | 必須 | FR_601 |
| FR-003 | リポジトリオープン後にワークツリー一覧画面へ遷移する | 必須 | FR_601 |
| FR-004 | 最近開いたリポジトリの履歴を永続的に保持する（最大20件） | 推奨 | FR_602 |
| FR-005 | 履歴からのクイックオープンを提供する | 推奨 | FR_602 |
| FR-006 | リポジトリのピン留め機能を提供する | 推奨 | FR_602 |
| FR-007 | テーマ切り替え（ライト/ダーク/システム連動）を提供する | 推奨 | FR_603 |
| FR-008 | Git 実行パスのカスタム設定を提供する | 推奨 | FR_603 |
| FR-009 | デフォルト作業ディレクトリ設定を提供する | 推奨 | FR_603 |
| FR-010 | 設定の永続化とアプリ起動時のリストアを行う | 推奨 | FR_603 |
| FR-011 | 型安全な Tauri command の公開パターンを提供する | 必須 | FR_604 |
| FR-012 | リクエスト/レスポンス型の invoke 通信パターンを提供する | 必須 | FR_604 |
| FR-013 | Tauri Core から Webview へのイベント通知パターン（`app_handle.emit` / `listen`）を提供する | 必須 | FR_604 |
| FR-014 | エラー通知をトースト形式で表示する | 必須 | FR_605 |
| FR-015 | エラーの重大度分類（info/warning/error）を提供する | 必須 | FR_605 |
| FR-016 | リトライ可能な操作のリトライ機能を提供する | 推奨 | FR_605 |
| FR-017 | エラー詳細の展開表示を提供する | 推奨 | FR_605 |
| FR-018 | IPC 通信エラーの Webview 側での統一ハンドリングを提供する | 必須 | FR_605 |

## 3.2. 非機能要件 (Non-Functional Requirements)

| ID | カテゴリ | 要件 | 目標値 | 根拠 (PRD) |
|---------|------|------|------|------|
| NFR-001 | 性能 | アプリケーション起動からUI表示完了まで | 3秒以内 | NFR_001 |
| NFR-002 | 性能 | IPC 通信のラウンドトリップレイテンシ | 50ms以内 | NFR_002 |
| NFR-003 | セキュリティ | Tauri セキュリティベストプラクティス準拠 | CSP 設定 + capabilities 最小化 + `#[tauri::command]` 入力バリデーション | DC_001 |
| NFR-004 | データ永続化 | 設定・履歴のローカル永続化 | アプリ再起動後もデータ保持 | DC_002 |

# 4. API

## 4.1. IPC API（Tauri Core ↔ Webview）

> IPC 通信は infrastructure 層に閉じ、application 層のリポジトリインターフェース経由でのみアクセスされる。Command 名は snake_case、Event 名は kebab-case で定義する。

### 4.1.1. リポジトリ管理（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `repository_open` | フォルダ選択ダイアログを表示し、選択されたリポジトリを開く | なし | `RepositoryInfo \| null` |
| `repository_open_path` | 指定パスのリポジトリを開く | `{ path: string }` | `RepositoryInfo \| null` |
| `repository_validate` | 指定パスが有効な Git リポジトリか検証する | `{ path: string }` | `boolean` |
| `repository_get_recent` | 最近開いたリポジトリ一覧を取得する | なし | `RecentRepository[]` |
| `repository_remove_recent` | 履歴から特定のリポジトリを削除する | `{ path: string }` | `void` |
| `repository_pin` | リポジトリをピン留め/解除する | `{ path: string; pinned: boolean }` | `void` |

### 4.1.2. アプリケーション設定（Commands, Webview → Core `invoke`）

| Command 名 | 概要 | 引数 | 戻り値 |
|-----------|------|------|--------|
| `settings_get` | 全設定を取得する | なし | `AppSettings` |
| `settings_set` | 設定を更新する | `{ settings: Partial<AppSettings> }` | `void` |
| `settings_get_theme` | 現在のテーマを取得する | なし | `Theme` |
| `settings_set_theme` | テーマを変更する | `{ theme: Theme }` | `void` |

### 4.1.3. エラー通知（Events, Core → Webview `emit` / `listen`）

| Event 名 | 概要 | ペイロード |
|---------|------|-----------|
| `error-notify` | エラー通知を Webview に送信する | `ErrorNotification` |

## 4.2. UseCase / Repository インターフェース（application 層）

### リポジトリ管理

```typescript
// リポジトリリポジトリ IF（application 層に定義、infrastructure 層で実装）
interface RepositoryRepository {
  open(): Promise<RepositoryInfo | null>;
  openByPath(path: string): Promise<RepositoryInfo | null>;
  validate(path: string): Promise<boolean>;
  getRecent(): Promise<RecentRepository[]>;
  removeRecent(path: string): Promise<void>;
  pin(path: string, pinned: boolean): Promise<void>;
}

// UseCase（ステートレス）
interface OpenRepositoryUseCase extends RunnableUseCase {
  invoke(): void; // ダイアログを開いてリポジトリを選択
}

interface OpenRepositoryByPathUseCase extends ConsumerUseCase<string> {
  invoke(path: string): void;
}

interface GetRecentRepositoriesUseCase extends ObservableStoreUseCase<RecentRepository[]> {
  readonly store: Observable<RecentRepository[]>;
}

interface RemoveRecentRepositoryUseCase extends ConsumerUseCase<string> {
  invoke(path: string): void;
}

interface PinRepositoryUseCase extends ConsumerUseCase<{ path: string; pinned: boolean }> {
  invoke(arg: { path: string; pinned: boolean }): void;
}

// Service（ステートフル、UseCase から利用される）
interface RepositoryService {
  readonly currentRepository$: Observable<RepositoryInfo | null>;
  readonly recentRepositories$: Observable<RecentRepository[]>;
  setCurrentRepository(repo: RepositoryInfo | null): void;
  updateRecentRepositories(repos: RecentRepository[]): void;
}
```

### アプリケーション設定

```typescript
// 設定リポジトリ IF
interface SettingsRepository {
  get(): Promise<AppSettings>;
  update(settings: Partial<AppSettings>): Promise<void>;
  getTheme(): Promise<Theme>;
  setTheme(theme: Theme): Promise<void>;
}

// UseCase
interface GetSettingsUseCase extends ReactivePropertyUseCase<AppSettings> {
  readonly property: ReadOnlyReactiveProperty<AppSettings>;
}

interface UpdateSettingsUseCase extends ConsumerUseCase<Partial<AppSettings>> {
  invoke(settings: Partial<AppSettings>): void;
}
```

### エラーハンドリング

```typescript
// エラー通知 UseCase
interface GetErrorNotificationsUseCase extends ObservableStoreUseCase<ErrorNotification[]> {
  readonly store: Observable<ErrorNotification[]>;
}

interface DismissErrorUseCase extends ConsumerUseCase<string> {
  invoke(errorId: string): void;
}

interface RetryErrorUseCase extends ConsumerUseCase<string> {
  invoke(errorId: string): void;
}
```

## 4.3. ViewModel インターフェース（presentation 層）

```typescript
// リポジトリ選択 ViewModel（純粋 TypeScript クラス、React 非依存）
interface RepositorySelectorViewModel {
  readonly recentRepositories$: Observable<RecentRepository[]>;
  readonly currentRepository$: Observable<RepositoryInfo | null>;
  openWithDialog(): void;
  openByPath(path: string): void;
  removeRecent(path: string): void;
  pin(path: string, pinned: boolean): void;
}

// 設定 ViewModel
interface SettingsViewModel {
  readonly settings$: Observable<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): void;
  setTheme(theme: Theme): void;
}

// エラー通知 ViewModel
interface ErrorNotificationViewModel {
  readonly notifications$: Observable<ErrorNotification[]>;
  dismiss(errorId: string): void;
  retry(errorId: string): void;
}
```

## 4.4. 型定義

```typescript
// リポジトリ情報
interface RepositoryInfo {
  path: string;
  name: string;
  isValid: boolean;
}

// 最近のリポジトリ
interface RecentRepository {
  path: string;
  name: string;
  lastAccessed: string; // ISO 8601
  pinned: boolean;
}

// アプリケーション設定
interface AppSettings {
  theme: Theme;
  gitPath: string | null; // null = システムデフォルト
  defaultWorkDir: string | null;
}

type Theme = 'light' | 'dark' | 'system';

// エラー通知
interface ErrorNotification {
  id: string;
  severity: ErrorSeverity;
  title: string;
  message: string;
  detail?: string;
  retryable: boolean;
  retryAction?: string; // IPC チャネル名
  timestamp: string; // ISO 8601
}

type ErrorSeverity = 'info' | 'warning' | 'error';

// IPC 通信の統一レスポンス型
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
| IPC | Inter-Process Communication。Tauri の invoke（Webview → Core）と emit（Core → Webview）による通信 |
| invoke | Webview から Tauri Core の `#[tauri::command]` 関数を呼び出す RPC 関数（`@tauri-apps/api/core`） |
| listen | Tauri Core が emit したイベントを Webview で購読する関数（`@tauri-apps/api/event`） |
| UseCase | application 層のステートレスな操作単位。Webview 側は `src/shared/lib/usecase/` の型を継承する |
| Service | application 層のステートフルな状態管理。UseCase から利用される |
| ViewModel | presentation 層の純粋 TypeScript クラス。UseCase の Observable を UI 状態に変換する |
| Hook ラッパー | ViewModel を React state に変換する Custom Hook（`useXxxViewModel()`） |
| トースト | 画面の端に一時的に表示される通知メッセージ |
| ピン留め | リポジトリを履歴一覧の上位に固定表示する機能 |

# 6. 使用例

```tsx
// presentation 層: Hook ラッパーを使用したリポジトリ選択
function RepositoryPage() {
  const {
    recentRepositories,
    currentRepository,
    openWithDialog,
    openByPath,
    removeRecent,
    pin,
  } = useRepositorySelectorViewModel()

  return (
    <div>
      <button onClick={openWithDialog}>リポジトリを開く</button>
      <ul>
        {recentRepositories.map((repo) => (
          <li key={repo.path}>
            <button onClick={() => openByPath(repo.path)}>{repo.name}</button>
            <button onClick={() => pin(repo.path, !repo.pinned)}>
              {repo.pinned ? 'ピン解除' : 'ピン留め'}
            </button>
            <button onClick={() => removeRecent(repo.path)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// presentation 層: Hook ラッパーを使用した設定変更
function SettingsPage() {
  const { settings, updateSettings, setTheme } = useSettingsViewModel()

  return (
    <div>
      <select
        value={settings.theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
      >
        <option value="light">ライト</option>
        <option value="dark">ダーク</option>
        <option value="system">システム連動</option>
      </select>
    </div>
  )
}
```

# 7. 振る舞い図

## 7.1. リポジトリオープンフロー（4層アーキテクチャ）

```mermaid
sequenceDiagram
    participant Component as React Component
    participant Hook as useRepositorySelectorViewModel
    participant VM as RepositorySelectorViewModel
    participant UC as OpenRepositoryUseCase
    participant Svc as RepositoryService
    participant Repo as RepositoryRepository (impl)
    participant Invoke as "@tauri-apps/api/core"
    participant Core as Tauri Core (Rust)
    participant Git as git CLI

    Component ->> Hook: openWithDialog()
    Hook ->> VM: openWithDialog()
    VM ->> UC: invoke()
    UC ->> Repo: open()
    Repo ->> Invoke: invoke<RepositoryInfo>('repository_open')
    Invoke ->> Core: Tauri IPC
    Core ->> Core: dialog::blocking_pick_folder()
    Core ->> Git: tokio::process::Command: git rev-parse --is-inside-work-tree
    Git -->> Core: 検証結果

    alt 有効なリポジトリ
        Core -->> Invoke: Ok(RepositoryInfo)
        Invoke -->> Repo: RepositoryInfo (IPCResult<T> 互換ラッパー経由)
        Repo -->> UC: RepositoryInfo
        UC ->> Svc: setCurrentRepository(repo)
        UC ->> Svc: updateRecentRepositories(repos)
        Svc -->> VM: currentRepository$ / recentRepositories$ 更新
        VM -->> Hook: Observable → React state
        Hook -->> Component: 再レンダリング
    else 無効なフォルダ
        Core -->> Invoke: Err(AppError)
        Invoke -->> Repo: IPCResult<T>(success=false, error)
        Repo -->> UC: エラー
        Note over UC: エラー通知サービスに通知
    end
```

## 7.2. エラー通知フロー

```mermaid
sequenceDiagram
    participant Core as Tauri Core (Rust)
    participant Listen as "@tauri-apps/api/event"
    participant Repo as ErrorNotificationRepository (impl)
    participant Svc as ErrorNotificationService
    participant UC as GetErrorNotificationsUseCase
    participant VM as ErrorNotificationViewModel
    participant Hook as useErrorNotificationViewModel
    participant Toast as ToastNotification

    Core ->> Listen: app_handle.emit('error-notify', notification)
    Listen ->> Repo: listen callback
    Repo ->> Svc: addNotification(notification)
    Svc -->> UC: notifications$ 更新
    UC -->> VM: notifications$ 更新
    VM -->> Hook: Observable → React state
    Hook -->> Toast: 再レンダリング・表示

    alt リトライ可能
        Toast ->> Hook: retry(errorId)
        Hook ->> VM: retry(errorId)
        VM ->> UC: RetryErrorUseCase.invoke(errorId)
    end
```

## 7.3. 設定変更フロー

```mermaid
sequenceDiagram
    participant Component as React Component
    participant Hook as useSettingsViewModel
    participant VM as SettingsViewModel
    participant UC as UpdateSettingsUseCase
    participant Svc as SettingsService
    participant Repo as SettingsRepository (impl)
    participant Invoke as "@tauri-apps/api/core"
    participant Core as Tauri Core (Rust)
    participant Store as tauri-plugin-store

    Component ->> Hook: setTheme('dark')
    Hook ->> VM: setTheme('dark')
    VM ->> UC: invoke({ theme: 'dark' })
    UC ->> Repo: update({ theme: 'dark' })
    Repo ->> Invoke: invoke<void>('settings_set', { settings: { theme: 'dark' } })
    Invoke ->> Core: Tauri IPC
    Core ->> Store: store.set('settings', ...)
    Store -->> Core: 保存完了
    Core -->> Invoke: Ok(())
    Invoke -->> Repo: IPCResult<void>(success=true)
    Repo -->> UC: void
    UC ->> Svc: updateSettings({ theme: 'dark' })
    Svc -->> VM: settings$ 更新
    VM -->> Hook: Observable → React state
    Hook -->> Component: 再レンダリング
```

# 8. 制約事項

- Webview から OS API（fs / process / shell）に直接アクセスしない（DC_001）
- Git 操作は必ず Tauri Core (Rust) で実行する
- IPC 通信は型安全なインターフェース（Tauri command / event）を経由する（FR_604）
- IPC 通信は infrastructure 層に閉じ、application 層はリポジトリ IF のみ参照する（A-004）
- Webview 側の domain / application 層はフレームワーク非依存の純粋な TypeScript で実装する（A-005）
- Rust 側の domain / application 層は `tauri::*` 非依存の純粋な Rust で実装する（A-007）
- ViewModel は UseCase のみ参照し、Service を直接参照しない（A-004）
- feature 間の直接参照は禁止。共有型は `src/shared/domain/` または `src/shared/lib/` に配置する（A-004）
- 設定・履歴データはローカルファイルシステムに永続化する（DC_002）
- 設定・履歴データの永続化には `tauri-plugin-store` を活用する（A-002）
- アプリ起動から UI 表示まで 3秒以内（NFR_001）

---

# PRD 整合性確認

| PRD 要求 ID | 本仕様での対応 | ステータス |
|-------------|--------------|----------|
| UR_001 | 仕様全体 | 対応済み |
| UR_002 | FR-001〜FR-006 | 対応済み |
| UR_003 | FR-007〜FR-010 | 対応済み |
| UR_004 | FR-011〜FR-013 | 対応済み |
| UR_005 | FR-014〜FR-018 | 対応済み |
| FR_601 | FR-001, FR-002, FR-003 + repository:open API | 対応済み |
| FR_602 | FR-004, FR-005, FR-006 + repository:get-recent API | 対応済み |
| FR_603 | FR-007〜FR-010 + settings:* API | 対応済み |
| FR_604 | FR-011〜FR-013 + IPCResult 型 | 対応済み |
| FR_605 | FR-014〜FR-018 + error:notify API | 対応済み |
| NFR_001 | NFR-001 | 対応済み |
| NFR_002 | NFR-002 | 対応済み |
| DC_001 | NFR-003 + 制約事項 | 対応済み |
| DC_002 | NFR-004 + 制約事項 | 対応済み |
