---
id: "impl-worktree-management-fr103-05"
title: "FR_103_05: ワークツリー削除時のローカルブランチ同時削除"
type: "implementation-log"
status: "completed"
sdd-phase: "implement"
created: "2026-04-14"
updated: "2026-04-14"
completed: "2026-04-14"
depends-on: ["design-worktree-management"]
ticket: "FR_103_05"
tags: ["worktree", "core", "ui"]
category: "core"
implementer: "Claude"
---

# FR_103_05 実装ログ

## 実装結果サマリー

| 項目 | 結果 |
|:---|:---|
| TypeScript 型チェック | pass |
| Rust cargo check | pass |
| Rust テスト (68件) | 全パス |
| TS テスト (37件) | 全パス |
| FR-021 カバレッジ | 完了 |
| FR-022 カバレッジ | 完了 |

## 変更ファイル一覧

### Backend (Rust)

| ファイル | 変更内容 |
|:---|:---|
| `src-tauri/src/features/worktree_management/domain.rs` | `WorktreeDeleteParams` に `delete_branch` 追加、`BranchDeleteResult` enum 追加 |
| `src-tauri/src/features/worktree_management/application/repositories.rs` | `delete_branch` メソッドを trait に追加 |
| `src-tauri/src/features/worktree_management/application/usecases.rs` | `delete_worktree` を拡張（ブランチ削除ロジック、他WT使用中チェック） |
| `src-tauri/src/features/worktree_management/infrastructure/git_repository.rs` | `delete_branch` 実装（`git branch -d/-D`） |
| `src-tauri/src/features/worktree_management/presentation/commands.rs` | `worktree_delete` の戻り値を `Option<BranchDeleteResult>` に変更 |

### Frontend (TypeScript/React)

| ファイル | 変更内容 |
|:---|:---|
| `src/domain/index.ts` | `WorktreeDeleteParams` に `deleteBranch` 追加、`BranchDeleteResult` 型追加 |
| `src/lib/ipc.ts` | `worktree_delete` の result 型を `BranchDeleteResult \| null` に変更 |
| `src/features/worktree-management/application/repositories/worktree-repository.ts` | `delete()` 戻り値変更、`forceDeleteBranch()` 追加、エラーコード追加 |
| `src/features/worktree-management/infrastructure/repositories/worktree-default-repository.ts` | `delete()` / `forceDeleteBranch()` 実装 |
| `src/features/worktree-management/application/usecases/delete-worktree-usecase.ts` | `requireForce` 時のリカバリーフロー追加 |
| `src/features/worktree-management/presentation/components/WorktreeDeleteDialog.tsx` | ブランチ削除チェックボックス追加（デフォルトON、他WT使用中disabled） |
| `src/features/worktree-management/presentation/components/WorktreeList.tsx` | `worktrees` props をダイアログに渡す |

### テスト

| ファイル | テスト数 |
|:---|:---|
| `src/features/worktree-management/application/__tests__/delete-worktree-usecase.test.ts` | 9件（既存4 + FR_103_05追加5） |
| `src/features/worktree-management/presentation/components/__tests__/WorktreeDeleteDialog.test.tsx` | 7件（新規） |

## 実装判断

| 判断事項 | 決定 | 理由 |
|:---|:---|:---|
| `BranchDeleteResult` のシリアライゼーション | `#[serde(tag = "type")]` tagged enum | フロントエンドで `result.type` でパターンマッチできる |
| 未マージブランチの強制削除 | `git_branch_delete` IPC を利用 | `worktree_delete` 後は WT が存在しないため、既存の `basic-git-operations` の IPC を活用 |
| `worktrees` props の追加 | `WorktreeList` → `WorktreeDeleteDialog` | 既に ViewModel で取得済みの一覧を渡すだけで IPC 追加不要 |
| Checkbox コンポーネント | shadcn/ui `Checkbox` を追加 | プロジェクトの UI コンポーネント方針に準拠 |
