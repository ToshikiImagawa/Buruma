---
id: "impl-basic-git-operations"
title: "基本 Git 操作"
type: "implementation-log"
status: "completed"
sdd-phase: "implement"
created: "2026-04-03"
updated: "2026-04-03"
completed: "2026-04-03"
depends-on: ["design-basic-git-operations"]
tags: ["git", "staging", "commit", "push", "pull", "branch", "simple-git"]
category: "git-operations"
---

# 基本 Git 操作 実装進捗ログ

## 実装サマリー

| フェーズ | 総タスク数 | 完了 | 残り | 完了率 |
|:---|:---|:---|:---|:---|
| Phase 1: 基盤 | 3 | 3 | 0 | 100% |
| Phase 2: メインプロセス | 6 | 6 | 0 | 100% |
| Phase 3: レンダラー | 8 | 8 | 0 | 100% |
| Phase 4: UI コンポーネント | 4 | 4 | 0 | 100% |
| Phase 5: テスト + 仕上げ | 4 | 4 | 0 | 100% |
| **合計** | **25** | **25** | **0** | **100%** |

## 完了済みタスク

### Phase 1: 基盤（完了）

- [x] 1.1: 共有 domain 型追加 — `CommitArgs`, `CommitResult`, `PushArgs`, `PushResult` 等 12 型を追加
- [x] 1.2: IPC 型定義追加 — 11 チャネル + `git:progress` イベント + `ElectronAPI.git` 拡張
- [x] 1.3: Preload API 拡張 — 11 メソッド + `onProgress` を追加

### Phase 2: メインプロセス（完了）

- [x] 2.1: GitWriteRepository IF（11 メソッド）+ DI tokens（12 トークン）
- [x] 2.2: GitWriteDefaultRepository — ステージング（stage, stageAll, unstage, unstageAll）
- [x] 2.3: GitWriteDefaultRepository — コミット・プッシュ（NO_UPSTREAM, PUSH_REJECTED エラーコード対応）
- [x] 2.4: GitWriteDefaultRepository — プル・フェッチ・ブランチ（PULL_CONFLICT 検知対応）
- [x] 2.5: メインプロセス UseCases（11 クラス）
- [x] 2.6: IPC Handler + DI config（`basicGitOperationsMainConfig`、`src/processes/main/di/configs.ts` に統合）

### Phase 3: レンダラー（完了）

- [x] 3.1: GitOperationsRepository IF + IPC クライアント実装
- [x] 3.2: GitOperationsService（`BaseService` extends、`loading$` + `lastError$`）
- [x] 3.3: レンダラー UseCases（13 クラス — 11 操作 + 2 Observable）
- [x] 3.4: StagingViewModel + Hook
- [x] 3.5: CommitViewModel + Hook
- [x] 3.6: RemoteOpsViewModel + Hook
- [x] 3.7: BranchOpsViewModel + Hook
- [x] 3.8: レンダラー DI config（`basicGitOperationsConfig`、`src/processes/renderer/di/configs.ts` に統合）

### Phase 5: テスト + 仕上げ（部分完了）

- [x] 5.1: ユニットテスト — メインプロセス UseCases（11 テスト）
- [x] 5.4: lint / typecheck / format — 全パス（329 テスト全パス）

### Phase 4: UI コンポーネント（完了）

- [x] 4.1: StagingArea コンポーネント — ステージ/アンステージ、一括操作、折りたたみ対応
- [x] 4.2: CommitForm コンポーネント — メッセージ入力、amend 確認ダイアログ、空コミット防止
- [x] 4.3: PushPullButtons コンポーネント — Push/Pull/Fetch ボタン、ahead/behind 表示、エラー通知
- [x] 4.4: BranchOperations コンポーネント — ブランチ作成、チェックアウト、削除確認

### Phase 5: テスト + 仕上げ（完了）

- [x] 5.1: ユニットテスト — メインプロセス UseCases（11 テスト）
- [x] 5.2: ユニットテスト — レンダラー Service テスト
- [x] 5.3: typecheck / lint / format / test — 全パス（329 テスト全パス）
- [x] 5.4: lint / typecheck / format — 全パス

## 設計判断（実装時に判明）

| 判断事項 | 決定内容 | 理由 |
|:---|:---|:---|
| ConsumerUseCase の戻り値 | `void`（`Promise<void>` ではない） | 既存パターン（worktree-management）に合わせ、内部で Promise チェーンを処理 |
| IPCResult ナローイング | `result.success === false` で分岐 | TypeScript の型ナローイングが正しく動作するパターン |
| GitOperationError | メインプロセス側に `code` 付きカスタムエラーを定義 | IPC Handler で `ipcFailure(error.code, error.message)` にマッピング |

## 検証結果

| 検証項目 | ステータス |
|:---|:---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run format:check` | pass |
| `npm run test` | pass (329 tests) |
