# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Buruma (Branch-United Real-time Understanding & Multi-worktree Analyzer) — Tauri v2 ベースの Git GUI デスクトップアプリケーション。フロントエンドは React + TypeScript、バックエンドは Rust。

## Commands

- `npm run tauri:dev` — 開発サーバー起動（Tauri + Vite HMR、ポート 1420）
- `npm run tauri:build` — Tauri リリースビルド
- `npm run dev` — Vite dev server のみ起動（フロントエンド単体、Tauri なし）
- `npm run build` — フロントエンドビルド（dist/ に出力）
- `npm run lint` — ESLint 実行
- `npm run typecheck` — TypeScript 型チェック (`tsc --noEmit`)
- `npm run format` — Prettier でフォーマット適用
- `npm run format:check` — フォーマット差分チェック（CI 向け）
- `npm run test` — Vitest でテスト実行
- `npm run test:watch` — Vitest ウォッチモード

単一テストファイルの実行: `npx vitest run src/path/to/__tests__/xxx.test.ts`

Rust バックエンドのビルド・テスト: `cd src-tauri && cargo build` / `cargo test`

## Architecture

Tauri v2 の Webview + Rust バックエンドアーキテクチャ。フロントエンド（React）と Rust バックエンドの両方で feature 単位の Clean Architecture 4層構成を採用。

```
src/                        # フロントエンド（React + TypeScript）
├── features/               # feature 単位モジュール
├── domain/                 # 共有ドメイン型（純粋 TypeScript、外部ライブラリ依存禁止）
├── lib/                    # 共有ライブラリ（DI, hooks, IPC 型, UseCase/Service 型等）
├── components/             # 共通 UI コンポーネント（Shadcn/ui 含む）
├── di/configs.ts           # 全 feature の DI 設定を集約
├── App.tsx                 # ルートコンポーネント
└── main.tsx                # エントリーポイント

src-tauri/src/              # バックエンド（Rust）
├── main.rs                 # エントリーポイント（lib::run() を呼ぶだけ）
├── lib.rs                  # Tauri ビルダー、全コマンド登録（67 コマンド）
├── state.rs                # グローバル AppState（Arc<dyn Trait> でリポジトリ注入）
├── error.rs                # 統一 AppError 型（{ code, message, detail } にシリアライズ）
├── git/                    # Git CLI ラッパーユーティリティ
└── features/               # feature 単位モジュール（フロントと対称）
```

### IPC 通信

Tauri コマンドによる型安全な IPC。フロントエンドは `invokeCommand()` ラッパーを通じて Rust バックエンドの `#[tauri::command]` を呼び出す。

- **コマンド定義**: `src/lib/ipc.ts` の `IPCChannelMap` で全 67 コマンドの引数・戻り値型を定義
- **イベント定義**: `src/lib/ipc.ts` の `IPCEventMap` で Tauri イベント型を定義
- **結果型**: `IPCResult<T>` = `{ success: true; data: T } | { success: false; error: IPCError }`
- **呼び出し**: `src/lib/invoke/commands.ts` の `invokeCommand<T>(cmd, args)` を使用
- **イベント受信**: `src/lib/invoke/events.ts` の `listenEvent<T>()` / `listenEventSync<T>()` を使用

### Features（6 モジュール）

| Feature | 説明 |
|:---|:---|
| `application-foundation` | リポジトリ管理、設定、エラー通知 |
| `repository-viewer` | Git 履歴、差分、ブランチ閲覧 |
| `basic-git-operations` | ステージ、コミット、プッシュ、プル、ブランチ操作 |
| `advanced-git-operations` | マージ、リベース、スタッシュ、チェリーピック、コンフリクト解決 |
| `worktree-management` | Worktree の CRUD と監視 |
| `claude-code-integration` | AI アシスタント統合（レビュー、解説、コミットメッセージ生成） |

各 feature はフロントエンド（`src/features/{name}/`）とバックエンド（`src-tauri/src/features/{name}/`）の両方に同名のディレクトリを持つ。

### Clean Architecture（4層構成）

フロントエンド・バックエンドの両方で同一パターン。依存方向は `domain ← application ← infrastructure / presentation` の一方向のみ。

**フロントエンド feature 構成**:

```
src/features/{feature-name}/
├── application/
│   ├── repositories/        # リポジトリ IF 定義
│   ├── services/            # Service IF 定義（*-interface.ts）+ Service 実装
│   └── usecases/            # UseCase 実装（1クラス1操作）
├── infrastructure/          # リポジトリ実装（Tauri IPC アダプター）
├── presentation/
│   ├── viewmodel-interfaces.ts  # ViewModel IF 定義
│   ├── components/          # React コンポーネント
│   ├── *-viewmodel.ts       # ViewModel 実装
│   └── use-*-viewmodel.ts   # Hook ラッパー
├── di-tokens.ts             # Token + UseCase 型エイリアス + re-export
└── di-config.ts             # VContainerConfig（useClass + deps パターン）
```

**Rust バックエンド feature 構成**:

```
src-tauri/src/features/{feature-name}/
├── domain/                  # エンティティ、値オブジェクト
├── application/
│   ├── repositories/        # リポジトリ trait 定義
│   └── usecases/            # UseCase 実装
├── infrastructure/          # リポジトリ実装（Git CLI、ファイルシステム等）
└── presentation/            # #[tauri::command] ハンドラー
```

- **domain / application 層はフレームワーク非依存**の純粋な TypeScript（or Rust）で実装する（フロントエンド application 層は RxJS の Observable のみ許可）
- リポジトリインターフェースは application 層に定義し、具象実装は infrastructure 層に配置、DI で注入する

### DI（依存性注入）アーキテクチャ

**フロントエンド**: `src/lib/di/` に軽量な DI コンテナライブラリ（VContainer）を内蔵。

- `createToken<T>(key)` — 型安全な InjectionToken を作成
- `container.registerSingleton()` / `registerTransient()` — サービス登録
- `container.resolve<T>(token)` — サービス取得
- `VContainerProvider` — configs（register + setUp）でコンテナを初期化し React ツリーに提供
- `useResolve<T>(token)` — DI コンテナからトークンでサービスを解決する Hook
- `useObservable<T>(observable, initialValue)` — RxJS Observable を React state に変換する Hook
- `asLazy(token)` で deps に指定すると `Lazy<T>` として注入され、`getValue()` 呼び出し時に解決される
- setUp 関数は priority で実行順制御、tearDown は `DisposableStack` で LIFO クリーンアップ

**Rust バックエンド**: `AppState`（`src-tauri/src/state.rs`）で `Arc<dyn Trait>` パターンによるリポジトリ注入。

**DI 登録パターン**:

- `registerSingleton(Token, Class, [deps])` の **useClass + deps** パターンを優先する
- deps 配列はコンストラクタ引数の順序と一致させる
- DI Token 以外の引数（外部インスタンス、コールバック等）が必要な場合のみファクトリー関数を使用する

**DI 統合エントリーポイント**: `src/di/configs.ts` に全 feature の DI 設定を集約。`App.tsx` は `di/configs.ts` のみを参照し、各 feature の具象クラスや di-config を直接参照しない。

**feature 追加時の手順**:

1. `src/features/{name}/di-config.ts` を作成
2. `src-tauri/src/features/{name}/` を作成（Rust 側）
3. `src/di/configs.ts` に config を 1 行追加
4. `src-tauri/src/lib.rs` にコマンドを登録

### Composition Root（依存関係の組み立て）

各 feature は Composition Root として `di-config.ts` と `di-tokens.ts` を持つ。

**エントリーポイントが infrastructure 層の具象クラスを直接参照してはならない。**

**di-tokens.ts の責務**:

- DI Token 定義（`createToken<IF>('Name')`）
- UseCase 型エイリアス定義（`type XxxUseCase = FunctionUseCase<T, R>`）
- 各層のインターフェースファイルからの re-export
- **インターフェース定義を直接記述しない**（各層の専用ファイルに配置）

### ViewModel + Hook パターン

ViewModel は純粋な TypeScript クラスとして実装し、RxJS Observable でデータを公開する。React コンポーネントからは Hook ラッパー経由で利用する:

```typescript
// ViewModel（純粋 TS クラス、DI で transient 登録）
class XxxViewModel {
    readonly items$: Observable<Item[]>
    constructor(useCase: GetItemsUseCase) { }
}

// Hook ラッパー（useResolve + useObservable で ViewModel を React に接続）
function useXxxViewModel() {
    const vm = useResolve(xxxViewModelToken)
    const items = useObservable(vm.items$, [])
    return { items }
}
```

### UseCase 型定義

`src/lib/usecase/types.ts` に共通 UseCase インターフェースを定義:

- `ConsumerUseCase<T>` / `RunnableUseCase` — 副作用のみ（戻り値なし）
- `FunctionUseCase<T, R>` / `SupplierUseCase<T>` — 値を返す
- `ObservableStoreUseCase<T>` / `ReactivePropertyUseCase<T>` — RxJS Observable でリアクティブデータを公開

**UseCase 実装ルール**:

- **1クラス = 1操作**: 複数のメソッドを持つ UseCase クラスを作らない
- 必ず上記のインターフェースを `implements` する
- ステートレス: 内部に BehaviorSubject 等の状態を持たない
- UseCase 型エイリアスは `di-tokens.ts` に定義（例: `type XxxUseCase = FunctionUseCase<T, R>`）

### Service 型定義

`src/lib/service/index.ts` に共通 Service インターフェースを定義。ステートフルな Service は必ずこれらを extends する:

- `BaseService` — 引数なし同期 setUp + tearDown
- `AsyncBaseService` — 引数なし非同期 setUp + tearDown
- `ParameterizedService<T>` — パラメータ付き同期 setUp + tearDown
- `AsyncParameterizedService<T>` — パラメータ付き非同期 setUp + tearDown

**ライフサイクルルール**:

- Service IF は必ず上記の共通インターフェースを extends する（`dispose()` ではなく `tearDown()` に統一）
- `setUp()` で初期データの注入を行い、`tearDown()` でリソースを解放する
- Observable プロパティは **constructor でフィールドとして1回だけ生成**する（getter で都度生成しない）

**命名ルール**:

- **Service**: ステートフルな状態管理を行うクラスのみ「Service」と命名する
- **Repository**: ステートレスな外部 API ラッパー（Tauri IPC、Git CLI、ダイアログ、ファイルシステム等）は「Repository」と命名する

## Tech Stack

**フロントエンド**:

- **React 19** + TypeScript 5.8 + Vite 6
- **RxJS** — 非同期データフロー、イベント駆動ロジック
- **Tailwind CSS v4** — `@tailwindcss/postcss` 経由（`postcss.config.js`）
- **Shadcn/ui** — `components.json` で設定（`rsc: false`）。`npx shadcn@latest add <component>` でコンポーネント追加
- **Monaco Editor** — コード差分表示
- **@tanstack/react-virtual** / **react-virtuoso** — 仮想スクロール
- **dnd-kit** — ドラッグ&ドロップ

**バックエンド**:

- **Tauri v2** — デスクトップアプリフレームワーク
- **Rust** (edition 2021) + tokio — 非同期ランタイム
- **tauri-plugin-dialog** / **tauri-plugin-store** — ネイティブダイアログ・永続ストレージ
- **notify** / **notify-debouncer-full** — ファイルシステム監視（Worktree 変更検知）

## Path Aliases

`tsconfig.json` の `paths` と `vite.config.ts` の `resolve.alias` で設定。

- `@/*` → `./src/*`
- `@domain` / `@domain/*` → `./src/domain/`
- `@lib` / `@lib/*` → `./src/lib/`

## ESLint 設定

`eslint.config.mjs` で用途ごとにグローバル変数を分離:

- **ビルド設定ファイル** (`vite.config.ts`, `vitest.config.ts` 等): Node.js グローバル許可
- **src/**（Webview）: Browser グローバルのみ
- `eslint-plugin-import-x` で未解決インポートと重複チェック
- `src-tauri/` は ESLint 対象外（Rust は `cargo clippy` で lint）

## AI-SDD Instructions (v3.3.0)

This project follows AI-SDD (AI-driven Specification-Driven Development) workflow.

### Document Operations

When operating files under `.sdd/` directory, refer to `.sdd/AI-SDD-PRINCIPLES.md` to ensure proper AI-SDD workflow compliance.

**Trigger Conditions**:

- Reading or modifying files under `.sdd/`
- Creating new specifications, design docs, or requirement docs
- Implementing features that reference `.sdd/` documents

### Directory Structure

Supports both flat and hierarchical structures.

**Flat Structure (for small to medium projects)**:

    .sdd/
    |- CONSTITUTION.md               # Project principles (top-level)
    |- PRD_TEMPLATE.md               # PRD template for this project
    |- SPECIFICATION_TEMPLATE.md     # Abstract specification template
    |- DESIGN_DOC_TEMPLATE.md        # Technical design template
    |- requirement/                  # PRD (Product Requirements Documents)
    |   |- {feature-name}.md
    |- specification/                # Specifications and designs
    |   |- {feature-name}_spec.md    # Abstract specification
    |   |- {feature-name}_design.md  # Technical design
    |- task/                         # Temporary task logs
        |- {ticket-number}/

**Hierarchical Structure (for medium to large projects)**:

    .sdd/
    |- CONSTITUTION.md               # Project principles (top-level)
    |- PRD_TEMPLATE.md               # PRD template for this project
    |- SPECIFICATION_TEMPLATE.md     # Abstract specification template
    |- DESIGN_DOC_TEMPLATE.md        # Technical design template
    |- requirement/                  # PRD (Product Requirements Documents)
    |   |- {feature-name}.md         # Top-level feature
    |   |- {parent-feature}/         # Parent feature directory
    |       |- index.md              # Parent feature overview & requirements list
    |       |- {child-feature}.md    # Child feature requirements
    |- specification/                # Specifications and designs
    |   |- {feature-name}_spec.md    # Top-level feature
    |   |- {feature-name}_design.md
    |   |- {parent-feature}/         # Parent feature directory
    |       |- index_spec.md         # Parent feature abstract spec
    |       |- index_design.md       # Parent feature technical design
    |       |- {child-feature}_spec.md   # Child feature abstract spec
    |       |- {child-feature}_design.md # Child feature technical design
    |- task/                         # Temporary task logs
        |- {ticket-number}/

### File Naming Convention (Important)

**Warning: The presence of suffixes differs between requirement and specification. Do not confuse them.**

| Directory         | File Type        | Naming Pattern                                 | Example                                   |
|:------------------|:-----------------|:-----------------------------------------------|:------------------------------------------|
| **requirement**   | All files        | `{name}.md` (no suffix)                        | `user-login.md`, `index.md`               |
| **specification** | Abstract spec    | `{name}_spec.md` (`_spec` suffix required)     | `user-login_spec.md`, `index_spec.md`     |
| **specification** | Technical design | `{name}_design.md` (`_design` suffix required) | `user-login_design.md`, `index_design.md` |

#### Naming Pattern Quick Reference

```
# Correct Naming
requirement/auth/index.md              # Parent feature overview (no suffix)
requirement/auth/user-login.md         # Child feature requirements (no suffix)
specification/auth/index_spec.md       # Parent feature abstract spec (_spec required)
specification/auth/index_design.md     # Parent feature technical design (_design required)
specification/auth/user-login_spec.md  # Child feature abstract spec (_spec required)
specification/auth/user-login_design.md # Child feature technical design (_design required)

# Incorrect Naming (never use these)
requirement/auth/index_spec.md         # requirement doesn't need _spec
specification/auth/user-login.md       # specification requires _spec/_design
specification/auth/index.md            # specification requires _spec/_design
```

### Document Link Convention

Follow these formats for markdown links within documents:

| Link Target   | Format                                   | Link Text           | Example                                              |
|:--------------|:-----------------------------------------|:--------------------|:-----------------------------------------------------|
| **File**      | `[filename.md](path or URL)`             | Include filename    | `[user-login.md](../requirement/auth/user-login.md)` |
| **Directory** | `[directory-name](path or URL/index.md)` | Directory name only | `[auth](../requirement/auth/index.md)`               |

This convention makes it visually clear whether the link target is a file or directory.
