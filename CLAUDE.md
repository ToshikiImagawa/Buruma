# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Buruma (Branch-United Real-time Understanding & Multi-worktree Analyzer) — Electron ベースの Git GUI アプリケーション。

## Commands

- `npm start` — 開発サーバー起動（Electron + Vite HMR）
- `npm run package` — アプリのパッケージング（out/ に出力）
- `npm run make` — 配布用インストーラー作成
- `npm run lint` — ESLint 実行 (`eslint .`)

**注意**: テストランナー（Vitest）は未インストール。テストコードは `src/lib/di/__tests__/` に存在するが、package.json に vitest が未追加のため実行不可。

## Architecture

Electron のマルチプロセスアーキテクチャ（main / preload / renderer）を採用。

- **Main process** (`src/main.ts`): アプリライフサイクル管理、BrowserWindow 作成。Vite 設定は `vite.main.config.ts`
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

**ライフタイム**: `singleton`（デフォルト、インスタンス再利用）、`transient`（毎回新規作成）。`scoped` は未実装。

**遅延解決**: `asLazy(token)` で deps に指定すると `Lazy<T>` として注入され、`getValue()` 呼び出し時に解決される。

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

`@/*` → `./src/*`（`tsconfig.json` の `paths` と `vite.renderer.config.ts` の `resolve.alias` で設定）。レンダラープロセスでのみ有効。

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
