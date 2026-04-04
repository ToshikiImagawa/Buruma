---
id: "impl-advanced-git-operations"
title: "高度な Git 操作"
type: "implementation-log"
status: "completed"
sdd-phase: "implement"
created: "2026-04-04"
updated: "2026-04-04"
completed: "2026-04-04"
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
| Phase 5: UI コンポーネント | 6 | 6 | 0 | 100% |
| Phase 6: テスト + 仕上げ | 4 | 4 | 0 | 100% |
| **合計** | **33** | **33** | **0** | **100%** |

## 完了済みタスク

### Phase 1: 基盤（完了）

- [x] 1.1: 共有 domain 型追加 — 20 型を `src/domain/index.ts` に追加
- [x] 1.2: IPC 型定義追加 — 24 チャネルを `IPCChannelMap` に追加 + `ElectronAPI.git` に 24 メソッド追加
- [x] 1.3: Preload API 拡張 — 24 メソッドを preload.ts に追加

### Phase 2: メインプロセス — マージ・コンフリクト解決（完了）

- [x] 2.1: GitAdvancedRepository IF（24 メソッド）+ DI tokens
- [x] 2.2: GitAdvancedDefaultRepository — マージ実装
- [x] 2.3: GitAdvancedDefaultRepository — コンフリクト解決実装
- [x] 2.4: メインプロセス UseCases — マージ・コンフリクト（8 クラス）
- [x] 2.5: IPC Handler + DI config

### Phase 3: メインプロセス — スタッシュ・リベース・チェリーピック・タグ（完了）

- [x] 3.1: GitAdvancedDefaultRepository — スタッシュ実装
- [x] 3.2: GitAdvancedDefaultRepository — リベース実装
- [x] 3.3: GitAdvancedDefaultRepository — チェリーピック・タグ実装
- [x] 3.4: メインプロセス UseCases — 残り 16 クラス
- [x] 3.5: IPC Handler 拡張 — 全 24 チャネル

### Phase 4: レンダラー（完了）

- [x] 4.1: AdvancedOperationsRepository IF + IPC クライアント実装
- [x] 4.2: AdvancedOperationsService（loading$, lastError$, operationProgress$, currentOperation$）
- [x] 4.3-4.4: レンダラー UseCases — 28 クラス（24 操作系 + 4 Observable）
- [x] 4.5-4.9: 6 ViewModel + 6 Hook（Merge, Rebase, Stash, CherryPick, Conflict, Tag）
- [x] 4.10: レンダラー DI config

### Phase 5: UI コンポーネント（完了）

- [x] 5.1: MergeDialog — ブランチ選択、ff/no-ff 切り替え、結果表示
- [x] 5.2: ConflictResolver + ThreeWayMergeView — Monaco Editor 3 ウェイマージ、ours/theirs/手動解決
- [x] 5.3: StashManager — save/list/pop/apply/drop/clear、確認ダイアログ
- [x] 5.4: RebaseEditor — @dnd-kit DnD 並べ替え、pick/squash/edit/drop アクション選択
- [x] 5.5: CherryPickDialog — コミット選択、複数コミット対応
- [x] 5.6: TagManager — lightweight/annotated 作成、削除確認

### Phase 6: テスト + 仕上げ（完了）

- [x] 6.1: ユニットテスト — メインプロセス UseCases（24 テスト）
- [x] 6.2: ユニットテスト — レンダラー AdvancedOperationsService（13 テスト）
- [x] 6.3: format 修正（Prettier 適用）
- [x] 6.4: lint / typecheck / format / test — 全パス

## 設計判断（実装時に判明）

| 判断事項 | 決定内容 | 理由 |
|:---|:---|:---|
| merge の ff-only 対応 | `--ff-only` を使用 | fast-forward 不可の場合にエラーで知らせる明示的な動作 |
| 3ウェイ内容取得 | `git show :1:`, `:2:`, `:3:` を使用 | Git の stage number を利用した標準的な方法 |
| インタラクティブリベース | `GIT_SEQUENCE_EDITOR` + 一時ファイルで todo リストを注入 | Git 公式の仕組み |
| DI 定数 REPO_AND_SERVICE | レンダラー di-config で共通 deps 配列を定数化 | 24 UseCase の冗長性削減 |
| 3ウェイマージ UI | Tabs（Base / Diff / Result）+ Monaco Editor | 横並び3パネルではなくタブ切り替えで画面幅の制約に対応 |

## 検証結果

| 検証項目 | ステータス |
|:---|:---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run format:check` | pass |
| `npm run test` | pass (366 tests) |
