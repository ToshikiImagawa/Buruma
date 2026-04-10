# プロジェクト原則

**バージョン**: 2.0.0
**最終更新日**: 2026-04-09
**ステータス**: 有効

## 目的

このドキュメントは、Buruma（Branch-United Real-time Understanding & Multi-worktree Analyzer）の開発を統制する非交渉原則と基準を定義します。すべてのコード、仕様、設計判断はこれらの原則に従う必要があります。

## 原則階層

```
1. ビジネス原則（最優先）
   ↓
2. アーキテクチャ原則
   ↓
3. 開発手法原則
   ↓
4. 技術制約
```

優先度が高い原則が低い原則に優先します。

---

## 1. ビジネス原則（最優先）

### B-001: Worktree-First UX

**原則**: ワークツリーを UI の主軸に据え、すべての操作フローはワークツリーの選択を起点とする

**適用範囲**: すべての UI 設計・画面遷移・機能設計

**検証方法**:

- [ ] UI の左パネルにワークツリー一覧が常時表示されているか
- [ ] すべての Git 操作が「どのワークツリーに対して行うか」が明確か
- [ ] ワークツリー間の切り替えが2クリック以内で可能か

**違反例**:

- ワークツリーの選択なしに Git 操作画面を表示する
- ブランチ一覧を主軸にした UI 設計
- ワークツリー情報が補助的な表示に留まる

**準拠例**:

- 左パネルのワークツリー一覧が常時表示され、選択で右パネルが切り替わる
- 新規ワークツリー作成がトップレベルのアクションとして提供される

---

### B-002: Git 操作の安全性

**原則**: 不可逆な Git 操作には必ず確認ステップを設け、ユーザーのデータを保護する

**適用範囲**: すべての Git 書き込み操作（コミット、プッシュ、ブランチ削除、リベース等）

**検証方法**:

- [ ] 不可逆操作（force push、ブランチ削除、ワークツリー削除等）に確認ダイアログがあるか
- [ ] 未コミット変更がある状態での破壊的操作に警告が表示されるか
- [ ] マージ・リベース中に常に中止（abort）オプションが提供されているか

**違反例**:

- 確認なしでリモートブランチを削除する
- 未コミット変更を警告なしで破棄する操作
- force push を通常のプッシュと同じ操作感で実行可能にする

**準拠例**:

- ワークツリー削除時に未コミット変更の有無を確認し、確認ダイアログを表示
- マージ中のコンフリクト解決画面で abort ボタンを常時表示

---

## 2. アーキテクチャ原則

### A-001: Tauri プロセス分離 / Rust-TypeScript 境界

**原則**: Rust バックエンド（Tauri Core）と TypeScript フロントエンド（Webview）を厳密に分離し、Tauri の invoke/emit 機構経由でのみ通信する。ソースコードも境界別にディレクトリを分離する

**適用範囲**: すべてのプロセス間通信、API 設計、ディレクトリ構成

**境界別ディレクトリ分離**:

| ディレクトリ | 境界 | 役割 |
|:---|:---|:---|
| `src-tauri/src/` | Rust (Tauri Core) | Tauri command、イベント emit、Git 操作、永続化。feature ごとに module 分離し、Clean Architecture 4 層で実装 |
| `src/features/` | TypeScript (Webview) | React UI、ViewModel、Hook。Clean Architecture 4 層で feature を実装 |
| `src/shared/` | TypeScript (共有) | Tauri invoke クライアント、domain 型、DI、ユーティリティ、IPC 型定義 |
| `src/components/` | TypeScript (Webview) | 共有 React コンポーネント、Shadcn/ui コンポーネント |
| `src-tauri/` (ルート) | 設定 | `tauri.conf.json`、`Cargo.toml`、`capabilities/*.json` |

- Webview (TS) と Tauri Core (Rust) は互いに具象実装を知らない（対等で独立）
- Webview のバンドルに Node.js/OS API が含まれてはならず、Rust バンドルに React が含まれてはならない
- 共有される型 (domain) は **TypeScript 側を真実の源** とし、Rust 側では `serde(rename_all = "camelCase")` で整合させる

**検証方法**:

- [ ] Webview から OS API（fs / process / shell / child_process）に直接アクセスしていないか
- [ ] `tauri.conf.json` の CSP が設定されているか（`default-src 'self'` ベース）
- [ ] `src-tauri/capabilities/*.json` で Tauri API の allowlist が最小化されているか
- [ ] Git 操作が必ず Rust 側 (`src-tauri/src/`) で実行されているか
- [ ] `src/` が `src-tauri/src/` を import していないか（逆も同様）
- [ ] 両側が使う型は `src/shared/domain/` に配置され、Rust 側 `src-tauri/src/domain/` と serde で整合しているか
- [ ] すべての `#[tauri::command]` に引数バリデーションが実装されているか
- [ ] すべての invoke/listen 呼び出しに型パラメータが付与されているか

**違反例**:

- Webview から `window.__TAURI__` を生のまま呼び出して型安全性を失う
- capabilities で `fs:default` など広範な権限を無条件に許可する
- Rust 側の domain 型を Webview にそのままコピーし手動管理する（serde rename なし）
- `src/features/` から `src-tauri/src/` のファイルを import する

**準拠例**:

- `src/shared/lib/invoke/commands.ts` で `invokeCommand<T>(cmd, args)` ラッパーを通じて呼び出す
- Webview は `@tauri-apps/api/core` と `@tauri-apps/api/event` のみを import する
- IPC コマンドごとに引数・戻り値の型を `src/shared/lib/ipc.ts` または `src/shared/lib/invoke/tauri-api.ts` に定義する
- Git 操作を Rust 側の `#[tauri::command]` 関数で処理し、`tokio::process::Command` 経由で `git` CLI を呼び出す
- domain 型を `src/shared/domain/` に配置し、`src-tauri/src/domain/` から serde 付き構造体として再定義する

---

### A-002: Library-First

**原則**: 可能な限り既存ライブラリを活用し、車輪の再発明を避ける

**適用範囲**: すべての実装

**検証方法**:

- [ ] 新規実装前に既存ライブラリを調査したか
- [ ] 自作する場合の明確な理由があるか

**違反例**:

- ライブラリ調査なしで自作実装
- 標準的な crate / npm パッケージが存在するにもかかわらず独自実装を作る

**準拠例**:

- Git 操作: `tokio::process::Command` で `git` CLI を呼び出し、既存 TypeScript パーサーを Rust に 1:1 移植する（将来 `git2` crate への移行を検討）
- ファイル監視: `notify` + `notify-debouncer-full` crate を使用
- 永続化: `tauri-plugin-store` を使用
- ダイアログ: `tauri-plugin-dialog` を使用
- UI コンポーネントに Shadcn/ui を使用
- 差分表示に Monaco Editor を使用
- 自作する場合は理由を設計書に明記

---

### A-003: DI（依存性注入）ベース設計

**原則**: すべてのサービス・ロジックの依存関係は境界ごとの DI 機構を通じて注入し、直接インスタンス化やグローバル参照を避ける

**適用範囲**: Webview 側のサービス層とビジネスロジック、Rust 側の UseCase/Repository

**境界別の DI 統合**:

- **Webview (TypeScript)**: `VContainer`（`src/shared/lib/di`）+ `VContainerProvider`（React 統合）+ `useResolve()` Hook でコンテナを提供
- **Tauri Core (Rust)**: `tauri::State<T>` + `Arc<Mutex<T>>` / `Arc<dyn Trait>` パターン。`#[tauri::command]` 関数から `State<'_, AppState>` で依存を取得する
- **共通**: Webview 側は `VContainerConfig`（register + setUp）で feature の初期化を統一。Rust 側は `AppState::new(app_handle)` で一括配線する

**検証方法（Webview 側）**:

- [ ] サービスの依存関係が InjectionToken を使用して VContainer に登録されているか
- [ ] サービス間の依存がコンストラクタ注入（deps）またはファクトリー関数で解決されているか
- [ ] Webview 側で VContainerProvider 経由でコンテナが提供されているか
- [ ] ライフタイム（singleton / transient）が適切に設定されているか
- [ ] リソース解放が必要なサービスは DisposableStack で管理されているか

**検証方法（Rust 側）**:

- [ ] Repository や UseCase の依存関係が `Arc<dyn Trait>` でコンストラクタ注入されているか
- [ ] グローバル `static` による共有を避け、`AppState` に集約しているか
- [ ] `#[tauri::command]` 関数が `State<'_, AppState>` で依存を取得しているか
- [ ] 非同期リソース（プロセス、watcher）は `Arc<Mutex<T>>` または `Arc<tokio::sync::Mutex<T>>` で共有されているか

**違反例**:

- サービスクラス内で他のサービスを直接 `new` して使用する
- グローバル変数やモジュールスコープの変数でサービスインスタンスを共有する
- React コンポーネントから VContainerProvider を経由せずにサービスを取得する
- Rust 側で `lazy_static!` / `static mut` によるグローバル共有を行う

**準拠例**:

- Webview: `createToken<T>()` で型安全なトークンを定義し、`container.register()` で登録
- Webview: `useVContainer()` フックでコンテナを取得し、`container.resolve()` でサービスを利用
- Webview: 親子コンテナ（`createScope()`）でスコープに応じた依存関係を管理
- Webview: setUp 関数で非同期初期化を行い、tearDown で DisposableStack を通じてクリーンアップ
- Rust: `AppState { pub usecase: Arc<SomeUseCase>, ... }` で全依存を集約し、`tauri::Builder::manage(state)` で登録
- Rust: UseCase のコンストラクタ引数で trait object (`Arc<dyn XxxRepository>`) を受け取る

---

### A-004: Clean Architecture（4層構成）

**原則**: feature 単位で domain / application / infrastructure / presentation の 4 層に分離し、依存方向は外側から内側への一方向のみとする

**適用範囲**: すべての feature 実装（Webview / Tauri Core 両方）

**依存方向**:

```
domain ← application ← infrastructure
                     ← presentation
```

- **domain**: 何にも依存しない（純粋な TypeScript / Rust のみ）
- **application**: domain のみに依存（Webview では RxJS の Observable、Rust では tokio の Future/Stream は許可）
- **infrastructure**: domain + application に依存
- **presentation**: domain + application に依存

**Webview 側の各層の責務**:

| 層 | 配置場所 | 責務 | 許可される依存 |
|:---|:---|:---|:---|
| **domain** | `src/shared/domain/` | エンティティ、値オブジェクト（境界間共有） | なし（純粋 TypeScript） |
| **application** | `src/features/*/application/` | UseCase（ステートレス）、Service（ステートフル）、リポジトリIF | domain, RxJS |
| **infrastructure** | `src/features/*/infrastructure/repositories/` | リポジトリ実装（Tauri invoke クライアント） | domain, application, `@tauri-apps/api` |
| **presentation** | `src/features/*/presentation/` | React コンポーネント、ViewModel、Hook ラッパー | domain, application, React, RxJS |

**Tauri Core (Rust) 側の各層の責務**:

| 層 | 配置場所 | 責務 | 許可される依存 |
|:---|:---|:---|:---|
| **domain** | `src-tauri/src/domain/` または `src-tauri/src/features/*/domain.rs` | エンティティ、値オブジェクト、ドメインエラー | std のみ、`serde`（シリアライズ用） |
| **application** | `src-tauri/src/features/*/application/` | UseCase、Repository trait (`async_trait`) | domain, `tokio`, `async-trait` |
| **infrastructure** | `src-tauri/src/features/*/infrastructure/` | Repository 実装（`tokio::process::Command`、`notify`、`tauri-plugin-store`）| domain, application, 外部 crate |
| **presentation** | `src-tauri/src/features/*/presentation/commands.rs` | `#[tauri::command]` 関数、`AppHandle::emit` | domain, application, tauri, serde |

**application 層の UseCase / Service / Repository 分離（Webview）**:

- **UseCase（ステートレス）**: `src/shared/lib/usecase/types.ts` の型（`ConsumerUseCase`, `FunctionUseCase`, `SupplierUseCase`, `RunnableUseCase`, `ObservableStoreUseCase` 等）を implements し、**1クラス = 1操作**を担う。内部に状態を持たない
- **Service（ステートフル）**: `src/shared/lib/service/` の型（`BaseService`, `ParameterizedService` 等）を extends し、BehaviorSubject 等で状態を保持・管理する。必ず `setUp()` / `tearDown()` を実装する
- **Repository（ステートレス）**: 外部リソースへのアクセスを抽象化するインターフェース。Tauri invoke クライアント、ローカルストレージ、ログ出力等が該当する。ステートレスな外部 API ラッパーは「Repository」と命名し、「Service」と命名しない
- ViewModel は UseCase のみを参照し、Service / Repository を直接参照しない

```
ViewModel → UseCase（ステートレス） → Service（ステートフル）
                                   → リポジトリIF → infrastructure 実装
```

**application 層の UseCase / Repository 分離（Rust）**:

- **UseCase**: `Arc<dyn XxxRepository>` を保持し、1 クラス = 1 操作を原則とする。`invoke(args)` メソッドで副作用を実行し、`Result<T, AppError>` を返す
- **Repository trait**: `async_trait` + `Send + Sync` 境界を明示。infrastructure 層で実装する
- ステートフルなリソース（ファイル watcher、プロセスマネージャー）は `Arc<Mutex<T>>` で保持し、UseCase から参照する

**インターフェース・実装の命名規則（Webview）**:

| 種別 | 命名パターン | 例 |
|:---|:---|:---|
| **インターフェース** | `XxxYyy`（`I` プレフィックスを付けない） | `StoreRepository`, `RepositoryService`, `WorktreeListViewModel` |
| **デフォルト実装** | `Xxx**Default**Yyy` | `StoreDefaultRepository`, `RepositoryDefaultService`, `WorktreeListDefaultViewModel` |
| **モック実装** | `Xxx**Mock**Yyy` | `StoreMockRepository`, `RepositoryMockService`, `WorktreeListMockViewModel` |

- インターフェースが「本来の名前」を持ち、実装が修飾される（`Default` / `Mock` 等）
- `I` プレフィックス（`IXxxRepository`）や `Impl` サフィックス（`XxxRepositoryImpl`）は使用しない

**命名規則（Rust）**:

| 種別 | 命名パターン | 例 |
|:---|:---|:---|
| **trait** | `XxxYyy` | `StoreRepository`, `GitValidationRepository` |
| **デフォルト実装** | `DefaultXxxYyy` または `{ConcreteName}Repository` | `DefaultStoreRepository`, `TauriStoreRepository` |
| **モック実装** | `mockall` で自動生成（`MockXxxYyy`） | `MockStoreRepository` |

**インターフェース定義の配置ルール（Webview）**:

- Repository IF: `application/repositories/` に配置
- Service IF: `application/services/` に配置（`*-interface.ts`）
- ViewModel IF: `presentation/viewmodel-interfaces.ts` に配置
- **di-tokens.ts にインターフェース定義を直接記述しない**。di-tokens.ts は Token 定義 + UseCase 型エイリアス（`src/shared/lib/usecase/types` の具体化）+ re-export のみとする

**DI 登録パターン（Webview）**:

- `registerSingleton(Token, Class, [deps])` の **useClass + deps** パターンを優先する
- deps 配列はコンストラクタ引数の順序と一致させる
- DI Token 以外の引数（外部インスタンス、コールバック等）が必要な場合のみファクトリー関数を使用する

**Observable 公開ルール（Webview）**:

- Service の Observable プロパティは **constructor でフィールドとして1回だけ生成**する（getter で都度生成しない）
- getter で `combineLatest()` 等を返すと `useObservable` Hook が毎回新しい参照を検出し無限ループを引き起こす

**feature 間依存ルール**:

- feature 間の直接参照は禁止する
- feature 間で共有が必要な型・ロジックは `src/shared/` または `src-tauri/src/` 直下（`src-tauri/src/git/` 等の横断モジュール）に切り出す
- feature 間の連携は application 層のインターフェース + DI で行う

**IPC 通信の位置付け**:

IPC は境界の「外部境界」であり、Webview 側と Rust 側で層が異なる:

| 境界 | IPC の役割 | 層 | Web に例えると |
|:---|:---|:---|:---|
| Webview | `invoke<T>('command_name', args)` を呼び出す | **infrastructure** | HTTP クライアント（fetch） |
| Tauri Core | `#[tauri::command]` で受け付ける | **presentation** | Controller / Route Handler |

- Webview 側: infrastructure 層の Repository 実装が `invokeCommand<T>` ラッパー経由で Tauri command を呼び出す
- Tauri Core 側: presentation 層の `#[tauri::command]` 関数がリクエストを受け付け、application 層の UseCase に委譲する
- application 層はリポジトリインターフェースのみ参照し、IPC の詳細を知らない

**presentation 層の状態管理（Webview の MVVM パターン）**:

- ViewModel は純粋な TypeScript クラスとして実装する（React 非依存、Observable を公開）
- 各 ViewModel に対応する Hook ラッパー（`useXxxViewModel()`）を作成し、Observable → React state 変換を担う
- React コンポーネントは Hook ラッパー経由でのみ ViewModel を利用する
- `useResolve(token)` で DI コンテナから ViewModel を取得し、`useObservable(obs$, initial)` で Observable を購読する
- ViewModel 単体のテストは React 不要（Observable のテストのみ）

```
// ViewModel クラス（React 非依存）
class XxxViewModel {
  constructor(private someUseCase: SomeUseCase) {}
  readonly items$ = this.someUseCase.store
  doAction(arg: string) { this.someUseCase.invoke(arg) }
}

// Hook ラッパー（Observable → React state）
function useXxxViewModel() {
  const vm = useResolve(XxxViewModelToken)
  const items = useObservable(vm.items$, [])
  return { items, doAction: vm.doAction }
}

// React コンポーネント
function XxxPanel() {
  const { items, doAction } = useXxxViewModel()
  return <ul>{items.map(...)}</ul>
}
```

**検証方法**:

- [ ] domain 層が他の層に依存していないか（純粋な TypeScript / Rust のみ）
- [ ] application 層が infrastructure / presentation に依存していないか
- [ ] infrastructure 層が presentation に依存していないか
- [ ] リポジトリインターフェース（または Rust trait）が application 層に、実装が infrastructure 層に配置されているか
- [ ] feature ごとに `src/features/{feature-name}/`（Webview）または `src-tauri/src/features/{feature_name}/`（Rust）配下にまとまっているか
- [ ] feature 間の直接参照が存在しないか
- [ ] Webview 側の Tauri invoke クライアントが infrastructure 層（Repository 実装）に閉じているか
- [ ] Rust 側の `#[tauri::command]` 関数が presentation 層（`presentation/commands.rs`）に配置されているか
- [ ] ViewModel が presentation 層に配置され、React に直接依存していないか
- [ ] UseCase がステートレスであるか（内部に BehaviorSubject 等の状態を持っていないか）
- [ ] UseCase が `src/shared/lib/usecase/types.ts` の型を implements しているか（Webview）
- [ ] UseCase が1クラス1操作になっているか（複数メソッドの UseCase がないか）
- [ ] Service IF が `BaseService` / `ParameterizedService` 等を extends しているか（Webview）
- [ ] Service がステートフルな状態管理を担い、ViewModel からの直接参照は禁止されているか（UseCase 経由）
- [ ] ViewModel が Service / Repository を直接参照せず UseCase のみを参照しているか
- [ ] Repository IF / Service IF / ViewModel IF が各層の専用ファイルに定義されているか（di-tokens.ts に定義していないか）
- [ ] DI 登録が useClass + deps パターンになっているか（不要なファクトリー関数がないか）
- [ ] Observable が getter ではなく constructor フィールドで公開されているか
- [ ] ステートレスな外部 API ラッパーが「Service」ではなく「Repository」と命名されているか

**違反例**:

- domain 層で React, `tauri::*`, RxJS 等の外部ライブラリをインポートする
- application 層から infrastructure の具象クラスを直接参照する
- feature をまたいで domain 層を直接参照する（共有は `src/shared/` または `src-tauri/src/` 経由）
- React コンポーネント内で直接 `invoke()` を呼び出す
- ViewModel 内で `useState` や `useEffect` を使用する
- UseCase 内に BehaviorSubject 等の状態を保持する
- UseCase が `src/shared/lib/usecase/types.ts` の型を implements していない（Webview）
- 1つの UseCase クラスに複数の操作メソッドを持たせる
- ViewModel が Service / Repository を直接参照する
- di-tokens.ts にインターフェース定義を直接記述する
- インターフェースに `I` プレフィックスを付ける（`IStoreRepository`）
- 実装クラスに `Impl` サフィックスを付ける（`StoreRepositoryImpl`）
- ステートレスな外部 API ラッパーを「Service」と命名する
- Service の Observable を getter で公開する（毎回新しい Observable を生成する）
- DI 登録でファクトリー関数を不要に使用する（useClass + deps で済む場合）

**準拠例**:

- domain 層にエンティティ・値オブジェクト・ドメインイベントを配置
- application 層に UseCase（ステートレス、`src/shared/lib/usecase/` 型を継承）と Service（ステートフル、状態管理）を配置
- UseCase が Service の状態を Observable として公開し、ViewModel が subscribe する
- infrastructure 層に Tauri invoke クライアント、git CLI 呼び出し、外部 API 連携の実装を配置し、リポジトリIF 経由で UseCase から利用
- presentation 層に ViewModel を配置し、UseCase のみを参照。React コンポーネントは hooks 経由で ViewModel を利用

---

### A-005: Pure TypeScript ビジネスロジック（Webview 層）

**原則**: Webview 側のビジネスロジック（domain 層・application 層）はフレームワーク非依存の純粋な TypeScript で実装する

**適用範囲**: `src/shared/domain/`、`src/features/*/application/`

**検証方法**:

- [ ] `src/shared/domain/` に React, `@tauri-apps/api`, OS API のインポートが存在しないか
- [ ] `src/features/*/application/` に React, `@tauri-apps/api` のインポートが存在しないか
- [ ] ビジネスロジックのテストがフレームワークのモック無しで実行可能か

**違反例**:

- domain 層で `import { invoke } from '@tauri-apps/api/core'` を使用
- application 層のユースケースで React hooks を使用
- ビジネスロジック内で `window` や `document` を参照

**準拠例**:

- domain 層のエンティティが plain class / interface のみで構成
- application 層のユースケースがリポジトリインターフェースのみに依存
- テストがブラウザ環境・Tauri 環境を不要とする

---

### A-006: RxJS リアクティブストリーム（Webview 層）

**原則**: Webview 側の非同期データフローおよびイベント駆動ロジックには RxJS の Observable パターンを採用する

**適用範囲**: Webview 側の application 層のユースケース、infrastructure 層のデータソース、presentation 層の状態管理

**検証方法**:

- [ ] Webview 側の非同期データフローが Observable ベースで実装されているか
- [ ] Subscription の解放が適切に管理されているか（DisposableStack / tearDown との連携）
- [ ] domain 層で RxJS に直接依存していないか（domain 層は純粋な TypeScript を維持）

**違反例**:

- domain 層のエンティティが Observable を返す
- Subscription を解放せずにメモリリークを発生させる
- コールバック地獄を RxJS で置き換え可能な箇所で放置する

**準拠例**:

- application 層のユースケースが `Observable<T>` を返し、presentation 層で subscribe する
- infrastructure 層で Tauri の `listen()` イベントを Observable に変換する
- VContainerProvider の setUp/tearDown で Subscription をまとめて管理する
- Rust 側の非同期処理は `tokio` の Future / Stream を使用する（RxJS は使用しない）

---

### A-007: Pure Rust ドメイン/アプリケーション層

**原則**: Rust 側の domain 層と application 層は `tauri::*` に依存せず、Tauri 環境なしで単体テスト可能とする

**適用範囲**: `src-tauri/src/domain/`、`src-tauri/src/features/*/domain.rs`、`src-tauri/src/features/*/application/`

**検証方法**:

- [ ] `src-tauri/src/features/*/domain.rs` に `use tauri::*` が存在しないか
- [ ] `src-tauri/src/features/*/application/**/*.rs` に `use tauri::*` が存在しないか
- [ ] Repository trait が `async_trait` + `Send + Sync` 境界を満たしているか
- [ ] UseCase のユニットテストが `mockall` + `tokio::test` で tauri 依存なしに実行できるか
- [ ] infrastructure / presentation 層のみが `tauri` crate に依存しているか

**違反例**:

- domain 層で `tauri::AppHandle` を保持する
- application 層の UseCase が `#[tauri::command]` 属性を持つ
- Repository trait が `tauri::State<T>` を引数に取る

**準拠例**:

- domain 型が `serde::{Serialize, Deserialize}` のみを使う
- UseCase が `Arc<dyn XxxRepository>` を保持し、trait オブジェクト経由で I/O を行う
- `tauri::AppHandle::emit` の呼び出しは presentation 層または infrastructure 層のイベント配信 Repository に閉じる

---

## 3. 開発手法原則

### D-001: Specification-Driven

**原則**: 仕様書なしで実装しない（AI-SDD ワークフローに従う）

**適用範囲**: すべての新機能・変更

**検証方法**:

- [ ] `*_spec.md` が存在する
- [ ] `*_design.md` が存在する
- [ ] 仕様書が最新（実装前に更新されている）
- [ ] PRD（`requirement/*.md`）から仕様書へのトレーサビリティが確保されている

**違反例**:

- 口頭指示のみで実装開始
- 仕様書が古いまま実装
- PRD の要求 ID を参照せずに機能を追加

**準拠例**:

- PRD → Spec → Design → Task → Implement のフローを遵守
- 仕様書を真実の源（Single Source of Truth）として管理

---

### D-002: Test-First

**原則**: テストを先に書いてから実装する（TDD）

**適用範囲**: すべてのコア機能（Rust 側の UseCase / Repository / `#[tauri::command]`、Webview 側の ViewModel）

**検証方法**:

- [ ] 実装前にテストケースが作成されている
- [ ] テストカバレッジ ≥ 80%（UI コンポーネントは ≥ 60%）
- [ ] 失敗するテストを先に書き、実装で通すフローを遵守

**違反例**:

- 実装完了後にテストを追加
- テストなしでのマージ

**準拠例**:

- Red → Green → Refactor のサイクルを遵守
- テストケース作成 → 実装 → リファクタリング

---

## 開発標準

### コード品質

| 標準 | 要件 | ツール | 適用方法 |
|:---|:---|:---|:---|
| **Linting (TS)** | エラー・警告ゼロ | ESLint 9 | Pre-commit hook |
| **Linting (Rust)** | エラー・警告ゼロ | `cargo clippy --all-targets -- -D warnings` | Pre-commit hook |
| **型安全性 (TS)** | 厳密な型チェック | TypeScript strict mode | CI/CD |
| **型安全性 (Rust)** | コンパイルが通る | `cargo check` | CI/CD |
| **複雑度** | 循環的複雑度 ≤ 10 | ESLint ルール / clippy | Code review |

### ドキュメント

| 標準 | 要件 | 配置場所 | 更新頻度 |
|:---|:---|:---|:---|
| **PRD** | すべての機能グループに PRD が必要 | `.sdd/requirement/` | 要求変更時 |
| **仕様書** | すべての機能に `*_spec.md` が必要 | `.sdd/specification/` | 実装前 |
| **設計書** | すべての実装に `*_design.md` が必要 | `.sdd/specification/` | 設計フェーズ |
| **API文書** | すべての Tauri command / event をドキュメント化 | ソースファイル内 | コード変更時 |

### テスト

| 標準 | 要件 | 適用方法 | 例外 |
|:---|:---|:---|:---|
| **ユニットカバレッジ (TS)** | ≥ 80% 行カバレッジ | CI/CD gate | UI コンポーネント (≥ 60%) |
| **ユニットカバレッジ (Rust)** | 主要 UseCase / Repository / パーサーで ≥ 80% | `cargo test` + CI/CD | - |
| **結合テスト** | すべてのメインフローをカバー | Manual review | - |
| **エッジケース** | 境界条件をテスト | Code review | - |

### セキュリティ

| 標準 | 要件 | 適用方法 | レビュー頻度 |
|:---|:---|:---|:---|
| **Tauri セキュリティ** | CSP 設定 + capabilities 最小化 | Architecture review | 設計フェーズ |
| **入力検証** | すべての `#[tauri::command]` 引数をバリデーション | Security review | 各 PR |
| **シークレット管理** | コードにシークレットを含めない | Pre-commit hooks | 各コミット |
| **依存関係スキャン** | 重大な脆弱性ゼロ | `npm audit` + `cargo audit` | 定期実行 |

## アーキテクチャ制約

### Tauri アーキテクチャ

```
src/ (React 19, Vite 6, Clean Architecture 4層)
   ↓ infrastructure 層（Tauri invoke クライアント）
   ↓ invoke<T>('command_name', args)
Tauri Runtime (IPC bridge)
   ↓
src-tauri/src/ (Rust, Clean Architecture 4層)
   ↑ presentation 層（#[tauri::command]）
   ↓ infrastructure 層
   ↓ tokio::process::Command / notify / tauri-plugin-store
Git / Claude Code CLI / ファイルシステム

イベント:
src-tauri/src/ --[app_handle.emit("xxx-yyy", payload)]--> Tauri Runtime
                                                        --[listen<T>("xxx-yyy")]--> src/
```

**ルール**:

- Webview から OS API（fs / process / shell / child_process）に直接アクセスしない
- Git 操作は必ず Rust 側 (`src-tauri/src/`) で実行する
- Claude Code CLI は Rust 側の `tokio::process::Command` から子プロセスとして起動する
- Tauri command には型安全なラッパー関数を `src/shared/lib/invoke/` に定義する
- Webview と Tauri Core の両方に Clean Architecture 4 層構成を適用する
- Rust 側の `#[tauri::command]` 関数は presentation 層に配置する（Controller に相当）
- イベントは `app_handle.emit(name, payload)` で Core → Webview の一方向通知に限定する

### 技術スタック制約

| レイヤー | 許可される技術 | 禁止事項 | 理由 |
|:---|:---|:---|:---|
| **フレームワーク** | Tauri 2.x | Electron, NW.js | Rust バックエンド、バンドルサイズ、セキュリティモデル |
| **バックエンド言語** | Rust (edition 2021+) | Node.js (main), Python, Go | Tauri 必須、メモリ安全性 |
| **バンドラー** | Vite 6 | Webpack, esbuild 直接 | Tauri Vite テンプレート標準 |
| **UI** | React 19, TypeScript | plain JS, Vue, Angular | 型安全性、エコシステム |
| **スタイリング** | Tailwind CSS v4 (`@tailwindcss/postcss`) | `@tailwindcss/vite`, CSS-in-JS | ESM 互換性問題の回避 |
| **コンポーネント** | Shadcn/ui (`rsc: false`) | Material UI, Ant Design | カスタマイズ性、バンドルサイズ |
| **リアクティブ (TS)** | RxJS | xstream, @most/core, 独自実装 | エコシステムの成熟度、TypeScript サポート |
| **Git 操作** | `tokio::process::Command` 経由の `git` CLI | `git2` (Phase 2 で再検討), shelling out without parser | 既存 TypeScript パーサーの 1:1 移植、worktree add / SSH 認証 / diff 出力の互換性 |
| **ファイル監視** | `notify` + `notify-debouncer-full` | `chokidar`, polling | クロスプラットフォーム、低レイテンシ |
| **永続化** | `tauri-plugin-store` | `electron-store`, lowdb | Tauri 標準プラグイン |
| **ダイアログ** | `tauri-plugin-dialog` | カスタムダイアログ | Tauri 標準プラグイン |
| **プロセス実行** | `tokio::process::Command` / `std::process::Command` | Node.js `child_process` | Rust 標準 |
| **Rust 非同期** | `tokio` | `async-std`, `smol` | Tauri 標準 |
| **Rust エラー** | `thiserror` + `AppError` enum + `anyhow`（内部のみ） | `panic!`, `unwrap()` in production | エラーハンドリング統一 |
| **エディタ** | Monaco Editor | CodeMirror | VS Code との親和性 |
| **テスト (TS)** | Vitest, Testing Library | Jest, Enzyme | Vite ネイティブ対応 |
| **テスト (Rust)** | `cargo test`, `mockall`, `tokio-test` | - | Rust 標準 |

**例外プロセス**: 設計書（`*_design.md`）に理由を明記し、レビューで承認を得る

### モジュール構成

```
/                            # プロジェクトルート
├── src/                     # TypeScript (Webview)
│   ├── main.tsx             # React エントリ
│   ├── App.tsx
│   ├── features/            # 機能モジュール（Clean Architecture 4層）
│   │   └── {feature-name}/
│   │       ├── application/         # UseCase, Service
│   │       │   ├── repositories/    # リポジトリ IF 定義
│   │       │   ├── services/        # Service IF + 実装
│   │       │   └── usecases/        # UseCase 実装
│   │       ├── infrastructure/
│   │       │   └── repositories/    # Tauri invoke クライアント実装
│   │       ├── presentation/        # ViewModel, Hook, React コンポーネント
│   │       ├── di-tokens.ts         # Token + UseCase 型エイリアス + re-export
│   │       └── di-config.ts         # VContainerConfig
│   ├── di/                  # Webview 側 config 集約
│   ├── components/          # 共有 React コンポーネント
│   │   └── ui/              # Shadcn/ui コンポーネント
│   └── shared/              # 境界間共有（TypeScript）
│       ├── domain/          # 共有エンティティ型（純粋 TypeScript）
│       └── lib/             # DI ライブラリ、UseCase 型、Service 型、invoke ラッパー
│           ├── di/          # VContainer（DI コンテナライブラリ）
│           ├── usecase/     # UseCase 共通インターフェース
│           ├── service/     # Service 共通インターフェース
│           ├── hooks/       # 共通 React Hooks
│           ├── invoke/      # Tauri invoke / listen ラッパー
│           └── ipc.ts       # IPCResult<T> 型、共有 IPC 型定義
├── src-tauri/               # Rust (Tauri Core)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── capabilities/
│   │   └── default.json     # Tauri API allowlist
│   ├── icons/
│   └── src/
│       ├── main.rs          # エントリ (lib::run() 呼び出し)
│       ├── lib.rs           # tauri::Builder 構築、command 登録
│       ├── error.rs         # AppError (thiserror + Serialize)
│       ├── state.rs         # AppState（依存配線）
│       ├── events.rs        # emit ヘルパー
│       ├── git/             # 共通 git CLI ラッパー
│       │   ├── command.rs   # tokio::process::Command ヘルパー
│       │   ├── porcelain.rs # status/worktree --porcelain パーサー
│       │   ├── diff_parser.rs
│       │   └── log_parser.rs
│       ├── domain/          # 共有 domain 型（必要に応じて）
│       └── features/
│           └── {feature_name}/   # snake_case
│               ├── mod.rs
│               ├── domain.rs     # feature 固有ドメイン型
│               ├── application/
│               │   ├── mod.rs
│               │   ├── repositories.rs   # trait 定義
│               │   └── usecases/         # UseCase 実装
│               ├── infrastructure/       # Repository 実装
│               └── presentation/
│                   └── commands.rs       # #[tauri::command]
├── vite.config.ts           # 統合 Vite 設定
├── index.html               # Vite entry
├── tsconfig.json
└── package.json
```

**依存ルール**:

- `src/` と `src-tauri/src/` は互いに import しない（対等で独立）
- 両境界が使う型は `src/shared/domain/`（TypeScript）に配置し、Rust 側は `src-tauri/src/domain/` で serde 付き構造体として再定義する
- `features/` 配下は 4 層の依存方向を厳守: domain ← application ← infrastructure / presentation
- `src/shared/domain/` と `src-tauri/src/domain/` はフレームワーク非依存（`React`, `@tauri-apps/api`, `tauri::*`, `RxJS` 等をインポートしない）
- `src/features/*/application/` と `src-tauri/src/features/*/application/` はフレームワーク非依存（RxJS の Observable、tokio の Future は許可）
- サービス間の依存は Webview では VContainer、Rust では `Arc<dyn Trait>` + `AppState` を通じて注入する
- Webview では VContainerProvider を React ツリーのルート付近に配置し、`useResolve()` でサービスを取得する
- Rust では `tauri::Builder::manage(AppState::new(...))` で依存を登録し、`#[tauri::command]` から `State<'_, AppState>` で取得する

## 意思決定フレームワーク

技術的トレードオフに直面した場合、以下の順序で優先順位付けします：

1. **安全性** - Git 操作でユーザーのデータを失わないか？
2. **正確性** - 仕様を満たしているか？
3. **セキュリティ** - Tauri セキュリティベストプラクティス（CSP / capabilities / 入力検証）に準拠しているか？
4. **シンプルさ** - 最もシンプルな解決策か？
5. **パフォーマンス** - 大規模リポジトリでも十分に高速か？
6. **保守性** - 保守可能か？

**タイブレーカー**: 後で変更しやすい方を選択

## 品質ゲート

### Pre-Commit

- [ ] ESLint がエラーなしで通る
- [ ] TypeScript のコンパイルが通る
- [ ] `cargo fmt --check` が通る
- [ ] `cargo clippy -- -D warnings` が通る
- [ ] シークレットが検出されない

### Pre-PR

- [ ] すべてのテスト (`vitest` + `cargo test`) が通る
- [ ] カバレッジ ≥ 80%
- [ ] 仕様整合性を確認（`/check-spec`）
- [ ] 設計書を更新

### Pre-Merge

- [ ] コードレビュー承認
- [ ] CI/CD パイプラインが成功
- [ ] マージコンフリクトなし
- [ ] ドキュメント更新

## 4. 技術制約

### T-001: TypeScript Strict Mode

**原則**: Webview 側のすべての TypeScript コードで strict モードを有効にし、any 型の使用を禁止する

**適用範囲**: `src/` 配下のすべての TypeScript ソースコード

**検証方法**:

- [ ] `tsconfig.json` で `strict: true` が設定されているか
- [ ] `any` 型が使用されていないか（ESLint `@typescript-eslint/no-explicit-any`）
- [ ] すべての関数に明確な型定義があるか

**違反例**:

- `any` 型を使用した変数宣言
- 型アサーション（`as any`）の多用
- `@ts-ignore` コメントの使用

**準拠例**:

- すべての変数・引数・戻り値に明確な型定義
- ジェネリクスを活用した型安全な API
- `unknown` 型 + 型ガードによる安全な型絞り込み

---

### T-002: No Runtime Errors

**原則**: 実行時エラーを許容しない（コンパイル時に検出）

**適用範囲**: すべてのコード（Webview / Rust）

**検証方法**:

- [ ] TS strict モード有効
- [ ] Rust のエラーは `Result<T, AppError>` で表現し `unwrap()` / `panic!` を避ける
- [ ] 型ガードの適切な使用（Webview）
- [ ] Error Boundary の実装（React コンポーネント）
- [ ] Tauri invoke 呼び出しのエラーハンドリングが網羅的（`IPCResult<T>` ラッパー経由）

**違反例**:

- `any` 型の多用
- `try-catch` のない非同期処理（Webview）
- 未処理の Promise rejection
- Rust 側の `unwrap()` / `expect()` の多用

**準拠例**:

- すべての関数に明確な型定義
- エラーケースの網羅的なハンドリング
- `IPCResult<T>` パターン（Webview）+ `Result<T, AppError>` パターン（Rust）

---

### T-003: Tauri セキュリティ制約

**原則**: Tauri のセキュリティベストプラクティスに準拠し、攻撃面を最小化する

**適用範囲**: `tauri.conf.json`、`src-tauri/capabilities/`、すべての `#[tauri::command]`、Webview の CSP

**検証方法**:

- [ ] `tauri.conf.json` の `app.security.csp` が `default-src 'self'` ベースで設定されているか
- [ ] `src-tauri/capabilities/default.json` で Tauri API allowlist が最小化されているか（不要な `core:*`, `fs:*`, `shell:*` を含まない）
- [ ] すべての `#[tauri::command]` 引数がバリデーションされているか（パストラバーサル、コマンドインジェクション対策）
- [ ] 外部 CLI 実行（`git`, `claude` 等）の実行ファイル名が allowlist 化されているか
- [ ] Tauri updater を使用する場合、公開鍵署名が有効化されているか

**違反例**:

- `capabilities` に `fs:default` や `shell:allow-execute` を広範に許可する
- `#[tauri::command]` が引数の path をそのまま `std::fs` や `tokio::process::Command` に渡す
- CSP を `default-src 'none'` 等の過剰緩和にする
- ユーザー入力文字列を `Command::arg(...)` でエスケープせずに渡す

**準拠例**:

- `capabilities/default.json` で `tauri-plugin-dialog` の `dialog:allow-open` のみ許可
- `#[tauri::command]` 内で path を `std::path::Path::canonicalize` + プレフィックスチェック
- `Command::arg(...)` を引数ごとに分割し、シェル経由の文字列結合を避ける
- CSP を Monaco Editor に必要な最小限（`script-src 'self' 'unsafe-eval'; worker-src blob:`）で構成

---

### T-004: Rust Strict Compilation

**原則**: Rust コードは clippy の pedantic レベルで警告ゼロとし、`unsafe` ブロックを原則禁止する

**適用範囲**: `src-tauri/src/**/*.rs`

**検証方法**:

- [ ] `cargo clippy --all-targets -- -D warnings` が通る
- [ ] `cargo clippy --all-targets -- -W clippy::pedantic` で発生する警告について個別に許容理由が明記されているか
- [ ] `unsafe` ブロックが存在しないか、または設計書に理由が記載されているか
- [ ] エラーハンドリングが `Result<T, AppError>` + `thiserror` で統一されているか
- [ ] `cargo fmt --check` が通る

**違反例**:

- `#[allow(clippy::all)]` でクレート全体の警告を抑制する
- `unsafe` ブロックを理由なく使用する
- production コードで `unwrap()` / `expect()` / `panic!` を多用する
- `anyhow::Error` を public API で返す（内部使用のみ許可）

**準拠例**:

- `#![deny(warnings)]` を `lib.rs` に設定（または CI で `-D warnings`）
- `AppError` enum を `thiserror::Error` で定義し、`From<std::io::Error>` などで自動変換
- `anyhow` は内部のエラーチェーン構築のみに使用し、境界は `AppError` に変換する
- `clippy::pedantic` の個別警告を許容する場合は `#[allow(clippy::xxx)]` に理由コメントを付ける

---

### T-005: IPC 型同期

**原則**: Rust 側の `#[tauri::command]` シグネチャと TypeScript 側の invoke 呼び出し型を同期し、境界を越えた型ドリフトを防ぐ

**適用範囲**: `src-tauri/src/features/*/presentation/commands.rs` と `src/shared/lib/invoke/`、`src/shared/lib/ipc.ts`

**検証方法（Phase 1 は手動同期）**:

- [ ] Rust 側の command 関数の引数・戻り値型が TypeScript 側の invoke 呼び出しと一致しているか（Code review で確認）
- [ ] domain 型（`src/shared/domain/`）と Rust 側の struct が `#[serde(rename_all = "camelCase")]` で整合しているか
- [ ] command 名（snake_case）と event 名（kebab-case）の命名規則が守られているか
- [ ] invoke ラッパー関数が `src/shared/lib/invoke/commands.ts` に集中定義されているか
- [ ] 新規 command 追加時は両側を同一 PR で更新する

**将来的な自動化（Phase 2 以降で検討）**:

- `specta` + `tauri-specta` で Rust 側から TypeScript 型を自動生成する
- 生成物を `src/shared/types/commands.ts` に配置し、CI で不整合を検出する

**違反例**:

- Rust 側の command シグネチャを変更したのに TypeScript 側の invoke 呼び出しを更新しない
- `invoke<any>('xxx', ...)` で型パラメータを省略する
- `src/shared/lib/invoke/` を経由せずにコンポーネント内で直接 `invoke` を呼ぶ

**準拠例**:

- Command の追加・変更を Rust 側と TS 側の両方で同じ PR にまとめる
- `invoke<RepositoryInfo>('repository_open', {})` のように型パラメータを明示する
- 型定義を `src/shared/domain/` に配置し、Rust 側は同名の struct を serde で整合させる

---

## 原則追加のガイドライン

新しい原則を追加する際は、以下を考慮してください：

### 良い原則の条件

| 条件 | 説明 |
|:---|:---|
| **検証可能** | チェックリストで検証できること |
| **明確** | 曖昧さがなく、準拠/違反の判断が明確であること |
| **正当化可能** | なぜその原則が必要かが説明できること |
| **実現可能** | チーム全体が実践できること |
| **永続的** | 一時的な方針ではなく、長期的に守るべき原則であること |

### 追加プロセス

```
1. 提案（Issue等で議論）
   ↓
2. 承認
   ↓
3. 原則ファイルに追加
   ↓
4. バージョンをマイナーアップ（例: 1.0.0 → 1.1.0）
   ↓
5. 影響を受けるドキュメントを更新
   ↓
6. /constitution validate で検証
```

## コンプライアンス

### 適用メカニズム

**自動化**:

- Pre-commit フック（ESLint、TypeScript コンパイル、`cargo fmt`, `cargo clippy`）
- CI/CD パイプライン（`vitest`, `cargo test`, カバレッジ）
- `npm audit` + `cargo audit`（依存関係の脆弱性）

**手動**:

- コードレビュー（アーキテクチャ、設計判断）
- `/constitution validate` による仕様・設計の準拠検証

### 違反への対処

| 重大度 | 対応 | 例 |
|:---|:---|:---|
| **重大** | 即座にマージをブロック | テストなし、セキュリティ設定の変更、capabilities 緩和 |
| **主要** | 明示的な正当化が必要 | 設計書なしの新機能追加、`unsafe` ブロックの導入 |
| **軽微** | 現在の PR またはフォローアップで修正 | 軽微なドキュメント更新 |

### 例外プロセス

原則の遵守が不可能な場合：

1. **文書化**: 設計書（`*_design.md`）の「設計判断」セクションに記録
2. **正当化**: なぜ原則に従えないか説明
3. **緩和**: 補償統制を説明
4. **レビュー**: レビューで承認を得る

## 変更履歴

### v2.0.0 (2026-04-09)

**Electron から Tauri 2 への全面移行（破壊的変更）**

- **A-001**: 「Electron プロセス分離」→「Tauri プロセス分離 / Rust-TypeScript 境界」に全面書き換え。ディレクトリ表を `src/` (Webview) + `src-tauri/` (Rust) + `src/shared/` 構成に刷新。検証項目から `nodeIntegration` / `contextIsolation` / Fuses を削除し、CSP / capabilities / 入力バリデーションに置換
- **A-002**: Library-First の例示を `simple-git` → `tokio::process::Command` + `git` CLI、`chokidar` → `notify`、`electron-store` → `tauri-plugin-store`、Electron ダイアログ → `tauri-plugin-dialog` に更新
- **A-003**: DI を「VContainer (Webview) + `tauri::State<T>` + `Arc<dyn Trait>` (Rust)」に二分化
- **A-004**: Clean Architecture 層定義表のメインプロセス列を Rust 版 (`src-tauri/src/features/{name}/`) に置換。IPC 通信の位置付け表を Webview (invoke) / Rust (`#[tauri::command]`) 版に刷新。配置パスを `src/features/*` と `src-tauri/src/features/*` に更新
- **A-005**: Pure TypeScript の適用範囲を Webview 層（`src/shared/domain/`, `src/features/*/application/`）に限定
- **A-006**: RxJS の適用範囲を Webview 層のみに明記。Rust 側は `tokio` Future / Stream を使用する旨を追記
- **A-007 (新規)**: Pure Rust ドメイン/アプリケーション層 — `src-tauri/src/domain/` と `src-tauri/src/features/*/application/` は `tauri::*` に依存せず、Tauri 環境なしで単体テスト可能とする
- **T-001**: 適用範囲を `src/` 配下の TypeScript に限定（main / preload / renderer という用語を廃止）
- **T-002**: No Runtime Errors の検証項目に Rust 側の `Result<T, AppError>` / `unwrap` 禁止を追加
- **T-003**: 「Electron セキュリティ制約」→「Tauri セキュリティ制約」に全面書き換え。`nodeIntegration` / `contextIsolation` / Fuses を削除し、CSP / capabilities / 入力バリデーション / 外部 CLI allowlist に置換
- **T-004 (新規)**: Rust Strict Compilation — `cargo clippy -D warnings` + pedantic、`unsafe` 禁止、`thiserror + AppError` 統一、`cargo fmt --check`
- **T-005 (新規)**: IPC 型同期 — Phase 1 は手動同期（`invoke<T>(...)` 型パラメータ必須、Rust / TS を同一 PR で更新）、将来 `specta + tauri-specta` 導入を検討
- **技術スタック制約表**: Tauri 2 + Rust + Vite 6 + `git` CLI + `notify` + `tauri-plugin-store` + `tauri-plugin-dialog` + `tokio` + `thiserror` + `mockall` 版に全面刷新
- **モジュール構成図**: `src/features/`、`src/shared/domain|lib`、`src/components/`、`src-tauri/` 構成に更新（Option B: Tauri 標準構造）
- **アーキテクチャ制約のシーケンス図**: Electron マルチプロセス図 → Tauri Webview/Core 図に置換
- **意思決定フレームワーク**: セキュリティ項目を Tauri ベストプラクティス準拠に更新
- **品質ゲート**: Pre-Commit / Pre-PR に `cargo fmt`, `cargo clippy`, `cargo test` を追加
- **開発標準セキュリティ**: Electron セキュリティ → Tauri セキュリティ（CSP + capabilities + 入力検証 + `cargo audit`）

### v1.0.0 (2026-03-25)

**初版原則の確立（Electron 時代）**

- B-001: Worktree-First UX を定義
- B-002: Git 操作の安全性を定義
- A-001: Electron プロセス分離を定義
- A-002: Library-First を定義
- A-003: DI（依存性注入）ベース設計を定義
- A-004: Clean Architecture（4層構成）を定義
- A-005: Pure TypeScript ビジネスロジックを定義
- A-006: RxJS リアクティブストリームを定義
- D-001: Specification-Driven を定義
- D-002: Test-First を定義
- T-001: TypeScript Strict Mode を定義
- T-002: No Runtime Errors を定義
- T-003: Electron セキュリティ制約を定義

---

## 関連ドキュメント

### この原則を参照すべきドキュメント

| ドキュメント | 参照方法 |
|:---|:---|
| `.sdd/SPECIFICATION_TEMPLATE.md` | 原則への言及セクションを含める |
| `.sdd/DESIGN_DOC_TEMPLATE.md` | 原則準拠のチェックリストを含める |
| `*_spec.md` | 原則に基づいた設計を記述 |
| `*_design.md` | 設計判断が原則に準拠していることを明記 |

### 原則準拠の検証

```bash
/constitution validate
```

このコマンドで、すべての仕様書・設計書が原則に従っているかを自動検証できます。

---

## セマンティックバージョニング

原則のバージョンは以下のルールに従います：

| バージョン種別 | 用途 | 例 |
|:---|:---|:---|
| Major | 既存原則の削除・大幅変更（破壊的変更） | 1.0.0 → 2.0.0 |
| Minor | 新しい原則の追加 | 1.0.0 → 1.1.0 |
| Patch | 原則の表現修正、誤字修正 | 1.0.0 → 1.0.1 |

---
