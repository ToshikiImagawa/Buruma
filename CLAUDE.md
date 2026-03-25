# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Buruma (Branch-United Real-time Understanding & Multi-worktree Analyzer) — Electron ベースの Git GUI アプリケーション。

## Commands

- `npm start` — 開発サーバー起動（Electron + Vite HMR）
- `npm run package` — アプリのパッケージング（out/ に出力）
- `npm run make` — 配布用インストーラー作成
- `npm run lint` — ESLint 実行 (`eslint .`)

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

## Tech Stack

- **Electron 41** + Electron Forge 7 + Vite 5
- **React 19** + TypeScript
- **Tailwind CSS v4** — `@tailwindcss/postcss` 経由（`postcss.config.js`）。`@tailwindcss/vite` は ESM only で Vite 5 と非互換のため使用不可
- **Shadcn/ui** — `components.json` で設定。`npx shadcn@latest add <component>` でコンポーネント追加。`rsc: false`（Server Components 無効）

## Path Aliases

`@/*` → `./src/*`（`tsconfig.json` の `paths` と `vite.renderer.config.ts` の `resolve.alias` で設定）。レンダラープロセスでのみ有効。
