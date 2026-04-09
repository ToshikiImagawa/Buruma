---
id: "task-tauri-migration"
title: "Electron → Tauri v2 + Rust 全面移行 RFC"
type: "task"
status: "in-progress"
sdd-phase: "tasks"
created: "2026-04-09"
updated: "2026-04-09"
depends-on: []
ticket: ""
tags: ["tauri-migration", "architecture", "rust"]
category: "infrastructure"
priority: "critical"
---

# Electron → Tauri v2 + Rust 全面移行 RFC（一時作業ファイル）

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 目的 | Electron 41 + Node.js から Tauri 2 + Rust への全面移行 |
| 方針文書 | `.sdd/requirement/tauri-migration.md` (P3 で作成)、`.sdd/specification/tauri-migration_spec.md` (P4)、`.sdd/specification/tauri-migration_design.md` (P5) |
| 実装計画 | `~/.claude/plans/scalable-knitting-squirrel.md` |
| 作業ブランチ | `feat/migrate-to-tauri` |
| 作成日 | 2026-04-09 |

> **注**: 本ファイルは SDD ドキュメント修正フェーズ（Phase P）中の一時的なワークログです。
> Phase P6（検証）完了時に重要な設計判断を `.sdd/specification/tauri-migration_design.md` に統合し、本ファイルは削除します。

## 背景

Buruma の現行スタック (Electron 41 + Node.js + React 19) を Tauri 2 + Rust + React 19 に全面移行する。フロントエンドは維持、バックエンドのみ Rust 化する。

### 調査で判明した重要事項

**既存 Electron 実装の Git 操作は実質的に `git` CLI shell out**:
- `simple-git` を使っているが、4 つのインフラ層で合計 45+ 回の `git.raw([...])` 呼び出しが存在
- 特に `worktree-management` / `advanced-git-operations` / `repository-viewer` は主要処理が CLI shell out
- Rust 側でも `tokio::process::Command` で `git` CLI を呼ぶ方式を採用し、既存パーサー (`parseDiffOutput`, `parsePorcelainOutput`, `parseLogOutput`) を Rust に 1:1 移植する
- `git2` crate への移行は Phase 2 以降の別マイルストーンに先送り

**IPC チャネル 83 個 + イベント 8 個**:
- `repository:*` (6), `settings:*` (4), `worktree:*` (8), `git:*` (50), `claude:*` (14)
- イベント: `error:notify`, `worktree:changed`, `git:progress`, `claude:output`, `claude:session-changed`, `claude:command-completed`, `claude:review-result`, `claude:explain-result`

## ユーザー確定事項（2026-04-09）

| 項目 | 決定 |
|:---|:---|
| **Git 実装方式** | `git` CLI shell out (`tokio::process::Command`) |
| **ディレクトリ構造** | Option B: Tauri 標準構造 (`src/` 直下、`src/shared/domain` `src/shared/lib`) |
| **メタ文書** | 新規 3 ファイル作成 (`.sdd/requirement/tauri-migration.md`, `.sdd/specification/tauri-migration_spec.md`, `tauri-migration_design.md`) |
| **CONSTITUTION 新原則** | A-007 (Pure Rust ドメイン/アプリ層), T-004 (Rust Strict Compilation), T-005 (IPC 型同期) を追加 |
| **CONSTITUTION version** | v1.0.0 → **v2.0.0** (Major bump) |
| **移行戦略** | 互換 shim → feature 単位で段階置換 → Phase IH で shim 削除 |
| **並行戦略** | 独立ブランチ (`feat/migrate-to-tauri`)、Phase 単位コミット |
| **型同期** | Phase 1 は手動同期（既存 `src/shared/domain` が真実の源）、将来 `specta/tauri-specta` 検討 |
| **IPCResult<T>** | 維持。Rust `Result<T, AppError>` を TS 側ラッパーで `IPCResult<T>` 互換に変換 |
| **command 命名** | Rust snake_case (`repository_open`), event kebab-case (`worktree-changed`) |
| **impl-status 扱い** | `implemented` → `not-implemented` にリセット、旧 Electron 実装は変更履歴へ退避 |

## 対応順序

```
Phase P: SDD ドキュメント修正
  P0. 準備（この RFC 配置）             ← 現在
  P1. CONSTITUTION.md v2.0.0
  P2. TEMPLATE 3 種
  P3. PRD 7 ファイル + tauri-migration.md
  P4. Spec 7 ファイル + tauri-migration_spec.md
  P5. Design 7 ファイル + tauri-migration_design.md
  P6. 全体検証
       ↓
Phase I: 実装移行
  IA. メイン基盤 (Tauri init, ディレクトリ再配置, 互換 shim)
  IB. application-foundation
  IC. worktree-management
  ID. repository-viewer
  IE. basic-git-operations
  IF. advanced-git-operations
  IG. claude-code-integration
  IH. クリーンアップ (shim / Electron 依存削除, CLAUDE.md 更新)
```

## IPC チャネル → Tauri command/event マッピング（下書き）

> **注**: 完全なマッピング表は Phase P4 で `.sdd/specification/tauri-migration_spec.md` に配置する。ここでは命名ルールのみ記載。

### 命名変換ルール

| 旧 (Electron) | 新 (Tauri) | 種別 |
|:---|:---|:---|
| `repository:open` | `repository_open` | command |
| `settings:get` | `settings_get` | command |
| `worktree:list` | `worktree_list` | command |
| `worktree:check-dirty` | `worktree_check_dirty` | command |
| `git:status` | `git_status` | command |
| `git:diff-staged` | `git_diff_staged` | command |
| `git:rebase-interactive` | `git_rebase_interactive` | command |
| `git:stash-save` | `git_stash_save` | command |
| `git:cherry-pick-abort` | `git_cherry_pick_abort` | command |
| `claude:start-session` | `claude_start_session` | command |
| `claude:generate-commit-message` | `claude_generate_commit_message` | command |
| `error:notify` | `error-notify` | event |
| `worktree:changed` | `worktree-changed` | event |
| `git:progress` | `git-progress` | event |
| `claude:output` | `claude-output` | event |
| `claude:session-changed` | `claude-session-changed` | event |
| `claude:command-completed` | `claude-command-completed` | event |

**ルール**:
- Command (invoke): `xxx:yyy-zzz` → `xxx_yyy_zzz` (全て snake_case)
- Event (emit/listen): `xxx:yyy-zzz` → `xxx-yyy-zzz` (全て kebab-case)

## Phase 進捗トラッカー

| Phase | 内容 | 状態 |
|:---|:---|:---|
| P0 | RFC 配置 | ✅ 完了 |
| P1 | CONSTITUTION.md v2.0.0 | 🔴 未着手 |
| P2 | TEMPLATE 3 種 | 🔴 未着手 |
| P3 | PRD 7 + tauri-migration.md | 🔴 未着手 |
| P4 | Spec 7 + tauri-migration_spec.md | 🔴 未着手 |
| P5 | Design 7 + tauri-migration_design.md | 🔴 未着手 |
| P6 | 全体検証 | 🔴 未着手 |
| IA | Tauri 初期化 + ディレクトリ再配置 + 疎通 | 🔴 未着手 |
| IB | application-foundation | 🔴 未着手 |
| IC | worktree-management | 🔴 未着手 |
| ID | repository-viewer | 🔴 未着手 |
| IE | basic-git-operations | 🔴 未着手 |
| IF | advanced-git-operations | 🔴 未着手 |
| IG | claude-code-integration | 🔴 未着手 |
| IH | クリーンアップ | 🔴 未着手 |

## 本 RFC の削除タイミング

Phase P6（全体検証）完了時に以下のいずれかを実施:

1. 本ファイル内の重要な設計判断（「ユーザー確定事項」「命名変換ルール」等）を `.sdd/specification/tauri-migration_design.md` の「変更履歴」「設計判断」セクションに統合
2. 本ファイル (`migration-rfc.md`) を削除
3. `.sdd/task/tauri-migration/` ディレクトリ自体も削除
