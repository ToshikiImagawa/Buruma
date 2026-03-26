# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Buruma (Branch-United Real-time Understanding & Multi-worktree Analyzer) — Electron ベースの Git GUI アプリケーション。

## Commands

- `npm start` — 開発サーバー起動（Electron + Vite HMR）
- `npm run package` — アプリのパッケージング（out/ に出力）
- `npm run make` — 配布用インストーラー作成
- `npm run lint` — ESLint 実行 (`eslint .`)
- `npm run typecheck` — TypeScript 型チェック (`tsc --noEmit`)
- `npm run format` — Prettier でフォーマット適用
- `npm run format:check` — フォーマット差分チェック（CI 向け）
- `npm run test` — Vitest でテスト実行
- `npm run test:watch` — Vitest ウォッチモード

## Architecture

Electron のマルチプロセスアーキテクチャ（main / preload / renderer）を採用。

- **Main process** (`src/main.ts`): アプリライフサイクル管理、BrowserWindow 作成。`src/di/main-configs.ts` 経由で feature を初期化する。Vite 設定は `vite.main.config.ts`
- **Preload** (`src/preload.ts`): contextBridge 経由でレンダラーに API を公開する。Vite 設定は `vite.preload.config.ts`
- **Renderer** (`src/renderer.tsx` → `src/App.tsx`): React UI。Vite 設定は `vite.renderer.config.ts`

Forge 設定（`forge.config.ts`）で VitePlugin が 3 つのエントリ（main, preload, renderer）を束ねる。FusesPlugin でセキュリティオプション（RunAsNode: false 等）を適用。

### IPC 通信ルール

- メインプロセスとレンダラーの通信は必ず preload + contextBridge を経由する
- レンダラーから Node.js API を直接使わない
- IPC チャネルには型安全なインターフェースを定義する

### DI（依存性注入）アーキテクチャ

`src/lib/di/` に軽量な DI コンテナライブラリ（VContainer）を内蔵。サービス間の依存関係は必ずこのコンテナを通じて注入する。

**コア API**:
- `createToken<T>(key)` — 型安全な InjectionToken を作成
- `container.register()` / `registerSingleton()` / `registerTransient()` — サービス登録
- `container.resolve<T>(token)` — サービス取得
- `container.createScope()` — 親子コンテナ階層

**React 統合**:
- `VContainerProvider` — configs（register + setUp）でコンテナを初期化し React ツリーに提供
- `useVContainer()` — コンポーネントからコンテナを取得
- setUp 関数は priority で実行順制御、tearDown は `DisposableStack` で LIFO クリーンアップ

**React Hooks**:
- `useResolve<T>(token)` — DI コンテナからトークンでサービスを解決する Hook（`src/lib/di/v-container-provider.tsx`）
- `useObservable<T>(observable, initialValue)` — RxJS Observable を React state に変換する Hook（`src/lib/hooks/use-observable.ts`）

**ライフタイム**: `singleton`（デフォルト、インスタンス再利用）、`transient`（毎回新規作成）。`scoped` は未実装。

**遅延解決**: `asLazy(token)` で deps に指定すると `Lazy<T>` として注入され、`getValue()` 呼び出し時に解決される。

### DI 統合エントリーポイント

`src/di/` に全 feature の DI 設定を集約する。`main.ts` と `App.tsx` は `src/di/` のみを参照し、各 feature の具象クラスや di-config を直接参照しない。

```
src/di/
├── renderer-configs.ts    ← 全 feature の VContainerConfig を集約
└── main-configs.ts        ← 全 feature の MainProcessConfig を集約
```

**feature 追加時の手順**:
1. `src/features/{name}/di-config.ts` を作成（レンダラー側）
2. `src/features/{name}/di-config-main.ts` を作成（メインプロセス側、必要な場合のみ）
3. `src/di/renderer-configs.ts` に config を 1 行追加
4. `src/di/main-configs.ts` に config を 1 行追加（メインプロセス側がある場合）

main.ts と App.tsx は変更不要。

### Composition Root（依存関係の組み立て）

各 feature は Composition Root として以下のファイルを持つ:

- `di-config.ts` — レンダラー側（`VContainerConfig` を実装）。infrastructure 層の具象クラスへの依存はこのファイルに閉じ込める
- `di-config-main.ts` — メインプロセス側（`MainProcessConfig` を実装）。infrastructure/main の具象クラスへの依存はこのファイルに閉じ込める

**main.ts や App.tsx が infrastructure 層の具象クラスを直接参照してはならない。**

### メインプロセス初期化フレームワーク

`src/lib/main-process/` にメインプロセス初期化の統一インターフェースとオーケストレーターを内蔵。

**MainProcessConfig**: VContainerConfig のメインプロセス対応版。各 feature の `di-config-main.ts` が実装する。
- `initialize()` — IPC ハンドラー登録、サービス生成等
- `dispose()` — リソース解放
- `priority` — 初期化の実行優先度（小さい値が先、デフォルト 0）

**bootstrapMainProcess(configs)**: MainProcessConfig の配列を priority 順に初期化し、DisposableStack で LIFO クリーンアップを管理する。

### ViewModel + Hook パターン

ViewModel は純粋な TypeScript クラスとして実装し、RxJS Observable でデータを公開する。React コンポーネントからは Hook ラッパー経由で利用する:

```typescript
// ViewModel（純粋 TS クラス、DI で transient 登録）
class XxxViewModel {
  readonly items$: Observable<Item[]>
  constructor(useCase: GetItemsUseCase) { ... }
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

### Service 型定義

`src/lib/service/index.ts` に共通 Service インターフェースを定義。ステートフルな Service は必ずこれらを extends する:

- `BaseService` — 引数なし同期 setUp + tearDown
- `AsyncBaseService` — 引数なし非同期 setUp + tearDown
- `ParameterizedService<T>` — パラメータ付き同期 setUp + tearDown
- `AsyncParameterizedService<T>` — パラメータ付き非同期 setUp + tearDown

すべて `TearDownable`（`src/lib/di/disposable-stack.ts`）を extends しており、`tearDown()` メソッドで BehaviorSubject の complete 等のリソース解放を行う。

**ライフサイクルルール**:
- Service IF は必ず上記の共通インターフェースを extends する（`dispose()` ではなく `tearDown()` に統一）
- `setUp()` で初期データの注入を行い、`tearDown()` でリソースを解放する
- DI コンテナの setUp/tearDown から Service の setUp/tearDown をインターフェース経由で呼び出す（具象クラスへのキャスト不要）

### Clean Architecture（4層構成）

feature 単位で Clean Architecture を採用。依存方向は `domain ← application ← infrastructure / presentation` の一方向のみ。

```
src/features/{feature-name}/
├── domain/          # エンティティ、値オブジェクト（純粋 TypeScript のみ、外部ライブラリ依存禁止）
├── application/     # ユースケース、リポジトリIF（純粋 TypeScript + RxJS Observable）
├── infrastructure/  # リポジトリ実装、IPC 通信、外部連携
└── presentation/    # React コンポーネント、ViewModel
```

- **domain / application 層はフレームワーク非依存**の純粋な TypeScript で実装する（application 層は RxJS の Observable のみ許可）
- リポジトリインターフェースは application 層に定義し、具象実装は infrastructure 層に配置、DI で注入する
- 非同期データフロー・イベント駆動ロジックには **RxJS** の Observable パターンを使用する
- feature 間の共有ロジックは `src/lib/` に、共有型定義は `src/types/` に配置する

## Tech Stack

- **Electron 41** + Electron Forge 7 + Vite 5
- **React 19** + TypeScript 5.8
- **RxJS** — 非同期データフロー、イベント駆動ロジック
- **Tailwind CSS v4** — `@tailwindcss/postcss` 経由（`postcss.config.js`）。`@tailwindcss/vite` は ESM only で Vite 5 と非互換のため使用不可
- **Shadcn/ui** — `components.json` で設定。`npx shadcn@latest add <component>` でコンポーネント追加。`rsc: false`（Server Components 無効）

## Path Aliases

`@/*` → `./src/*`（`tsconfig.json` の `paths` と各 Vite 設定の `resolve.alias` で設定）。全プロセス（main / preload / renderer）で有効。

## ESLint 設定

`eslint.config.mjs` でプロセスごとにグローバル変数を分離:
- **main / preload**: Node.js グローバル許可
- **renderer**: Browser グローバルのみ
- `eslint-plugin-import-x` で未解決インポートと重複チェック

## AI-SDD Instructions (v3.3.0)

<!-- sdd-workflow version: "3.3.0" -->

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

| Link Target    | Format                                     | Link Text             | Example                                              |
|:---------------|:-------------------------------------------|:----------------------|:-----------------------------------------------------|
| **File**       | `[filename.md](path or URL)`               | Include filename      | `[user-login.md](../requirement/auth/user-login.md)` |
| **Directory**  | `[directory-name](path or URL/index.md)`   | Directory name only   | `[auth](../requirement/auth/index.md)`               |

This convention makes it visually clear whether the link target is a file or directory.
