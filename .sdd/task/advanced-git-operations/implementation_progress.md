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
| Phase 3: メインプロセス（その他） | 5 | 5 | 0 | 100% |
| Phase 4: レンダラー | 10 | 10 | 0 | 100% |
| Phase 5: UI コンポーネント | 6 | 0 | 6 | 0% |
| Phase 6: テスト + 仕上げ | 4 | 0 | 4 | 0% |
| **合計** | **33** | **23** | **10** | **70%** |

## 完了済みタスク

### Phase 1: 基盤（完了）

- [x] 1.1: 共有 domain 型追加 — 20 型を `src/domain/index.ts` に追加
- [x] 1.2: IPC 型定義追加 — 24 チャネルを `IPCChannelMap` に追加 + `ElectronAPI.git` に 24 メソッド追加
- [x] 1.3: Preload API 拡張 — 24 メソッドを preload.ts に追加

### Phase 2: メインプロセス — マージ・コンフリクト解決（完了）

- [x] 2.1: GitAdvancedRepository IF（24 メソッド）+ DI tokens（マージ・コンフリクト 8 トークン）
- [x] 2.2: GitAdvancedDefaultRepository — マージ実装（merge, mergeAbort, mergeStatus）
- [x] 2.3: GitAdvancedDefaultRepository — コンフリクト解決実装（conflictList, conflictFileContent, conflictResolve, conflictResolveAll, conflictMarkResolved）
- [x] 2.4: メインプロセス UseCases — マージ・コンフリクト（8 クラス）
- [x] 2.5: IPC Handler + DI config（`advancedGitOperationsMainConfig`、`src/processes/main/di/configs.ts` に統合）

### Phase 3: メインプロセス — スタッシュ・リベース・チェリーピック・タグ（完了）

- [x] 3.1: GitAdvancedDefaultRepository — スタッシュ実装（stashSave, stashList, stashPop, stashApply, stashDrop, stashClear）
- [x] 3.2: GitAdvancedDefaultRepository — リベース実装（rebase, rebaseInteractive, rebaseAbort, rebaseContinue, getRebaseCommits）
- [x] 3.3: GitAdvancedDefaultRepository — チェリーピック・タグ実装（cherryPick, cherryPickAbort, tagList, tagCreate, tagDelete）
- [x] 3.4: メインプロセス UseCases — 残り 16 クラス
- [x] 3.5: IPC Handler 拡張 — 全 24 チャネル登録完了。DI tokens 全 24 トークン定義完了

### Phase 4: レンダラー（完了）

- [x] 4.1: AdvancedOperationsRepository IF + IPC クライアント実装（24 メソッド）
- [x] 4.2: AdvancedOperationsService（loading$, lastError$, operationProgress$, currentOperation$）
- [x] 4.3: レンダラー UseCases — マージ・コンフリクト解決（8 クラス）
- [x] 4.4: レンダラー UseCases — 残り + Observable UseCases（20 クラス）
- [x] 4.5: MergeViewModel + Hook
- [x] 4.6: ConflictViewModel + Hook
- [x] 4.7: StashViewModel + Hook
- [x] 4.8: RebaseViewModel + Hook
- [x] 4.9: CherryPickViewModel + TagViewModel + Hooks
- [x] 4.10: レンダラー DI config（`advancedGitOperationsConfig`、`src/processes/renderer/di/configs.ts` に統合）

## 設計判断（実装時に判明）

| 判断事項 | 決定内容 | 理由 |
|:---|:---|:---|
| Repository スタブ→実装 | Phase 2 でスタブ化した未実装メソッドを Phase 3 で実装に置き換え | 段階的実装により typecheck を常にパス |
| merge の ff-only 対応 | `--ff-only` を使用 | fast-forward 不可の場合にエラーで知らせる明示的な動作 |
| 3ウェイ内容取得 | `git show :1:`, `:2:`, `:3:` を使用 | Git の stage number を利用した標準的な方法 |
| インタラクティブリベース | `GIT_SEQUENCE_EDITOR` + 一時ファイルで todo リストを注入 | Git 公式の仕組み。simple-git の `.env()` で環境変数を設定 |
| DI 定数 REPO_AND_SERVICE | レンダラー di-config で共通 deps 配列を定数化 | 24 UseCase に同じ deps を繰り返す冗長性を削減 |

## 検証結果

| 検証項目 | ステータス |
|:---|:---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test` | pass (329 tests) |
