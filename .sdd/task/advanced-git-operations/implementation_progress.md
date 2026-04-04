---
id: "impl-advanced-git-operations"
title: "高度な Git 操作"
type: "implementation-log"
status: "in-progress"
sdd-phase: "implement"
created: "2026-04-04"
updated: "2026-04-04"
completed: ""
depends-on: ["design-advanced-git-operations"]
tags: ["git", "merge", "rebase", "stash", "cherry-pick", "conflict", "tag"]
category: "git-operations"
---

# 高度な Git 操作 実装進捗ログ

## 実装サマリー

| フェーズ | 総タスク数 | 完了 | 残り | 完了率 |
|:---|:---|:---|:---|:---|
| Phase 1: 基盤 | 3 | 3 | 0 | 100% |
| Phase 2: メインプロセス（マージ・コンフリクト） | 5 | 5 | 0 | 100% |
| **合計（今回スコープ）** | **8** | **8** | **0** | **100%** |

## 完了済みタスク

### Phase 1: 基盤（完了）

- [x] 1.1: 共有 domain 型追加 — 20 型を `src/domain/index.ts` に追加（MergeOptions, MergeResult, MergeStatus, RebaseOptions, InteractiveRebaseOptions, RebaseStep, RebaseAction, RebaseResult, StashSaveOptions, StashEntry, CherryPickOptions, CherryPickResult, ConflictFile, ThreeWayContent, ConflictResolveOptions, ConflictResolution, ConflictResolveAllOptions, TagInfo, TagCreateOptions, OperationProgress）
- [x] 1.2: IPC 型定義追加 — 24 チャネルを `IPCChannelMap` に追加 + `ElectronAPI.git` に 24 メソッド追加
- [x] 1.3: Preload API 拡張 — 24 メソッドを preload.ts に追加

### Phase 2: メインプロセス — マージ・コンフリクト解決（完了）

- [x] 2.1: GitAdvancedRepository IF（24 メソッド）+ DI tokens（マージ・コンフリクト 8 トークン）
- [x] 2.2: GitAdvancedDefaultRepository — マージ実装（merge, mergeAbort, mergeStatus）
- [x] 2.3: GitAdvancedDefaultRepository — コンフリクト解決実装（conflictList, conflictFileContent, conflictResolve, conflictResolveAll, conflictMarkResolved）
- [x] 2.4: メインプロセス UseCases — マージ・コンフリクト（8 クラス）
- [x] 2.5: IPC Handler + DI config（`advancedGitOperationsMainConfig`、`src/processes/main/di/configs.ts` に統合）

## 設計判断（実装時に判明）

| 判断事項 | 決定内容 | 理由 |
|:---|:---|:---|
| 後続 Phase のスタブ | Repository IF の未実装メソッドを `throw new Error('Not implemented')` でスタブ化 | Phase 2 では マージ・コンフリクトのみ実装。typecheck を通すために全メソッドをスタブで定義 |
| merge の ff-only 対応 | `--ff-only` を使用（`--ff` ではなく） | fast-forward 不可の場合にエラーで知らせる明示的な動作 |
| 3ウェイ内容取得 | `git show :1:`, `:2:`, `:3:` を使用 | Git の stage number を利用した標準的な方法。base=:1, ours=:2, theirs=:3 |

## 検証結果

| 検証項目 | ステータス |
|:---|:---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test` | pass (329 tests) |
