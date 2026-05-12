---
id: "task-refactor-ai-tools"
title: "Claude Code 連携リファクタリング"
type: "task"
status: "in_progress"
sdd-phase: "tasks"
created: "2026-05-11"
updated: "2026-05-11"
depends-on: ["design-claude-code-integration"]
ticket: "REFACTOR_AI_TOOLS"
tags: ["claude-code", "ai", "refactoring"]
category: "ai-integration"
priority: "medium"
---

# Claude Code 連携リファクタリング タスク分解

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | Claude Code 連携の内部リファクタリング |
| チケット番号 | REFACTOR_AI_TOOLS |
| 技術設計書 | [claude-code-integration_design.md](../../specification/claude-code-integration_design.md) §11. リファクタリング計画 |
| 抽象仕様書 | [claude-code-integration_spec.md](../../specification/claude-code-integration_spec.md) |
| PRD | [claude-code-integration.md](../../requirement/claude-code-integration.md) |
| 作成日 | 2026-05-11 |
| 作業ブランチ | `claude/refactor-ai-tools-sdd-USuj0` |

## スコープ

設計書 §11.2 に定義された 4 項目を対象とする:

- R-01: 状態取得 UseCase 12 個を `ObservableQueryUseCase<T>` で集約 — **本セッションで実施**
- R-02: `ClaudeDefaultService` を `ChatHistoryService` + `ClaudeStateService` に分割 — **次セッション持ち越し**
- R-03: Rust 側 `OutputParser` を独立モジュール化 — **本セッションで実施**
- R-04: Rust 側 Prompt Builder を `infrastructure/prompts/` に分離 — **本セッションで実施**

**スコープ外**: spec.md の変更、公開 API（IPC コマンド / React Props / 型定義）の変更、未実装機能（FR-008/019/023）の追加。

**R-02 持ち越し理由**: 460 行・20+ BehaviorSubject の状態が `currentSession$ ↔ currentConversationId$ ↔ commandRunningMap ↔ sessionStore` と深く絡んでおり、4 ViewModel + 10 UseCase + Hook + 既存テストすべての配線変更を伴う。R-01/R-03/R-04 のクリーンな成果を独立コミットとして残し、R-02 は単独セッションで focused に実施するほうがレビュー性とロールバック性が高いと判断した。

## タスク一覧

### Phase 1: R-01 (Generic UseCase 集約)

| # | タスク | 説明 | 完了条件 | 依存 | ステータス |
|:---|:---|:---|:---|:---|:---|
| 1.1 | `ObservableQueryUseCase<T>` 実装 | `src/lib/usecase/observable-query-usecase.ts` を新規作成。`ObservableStoreUseCase<T>` を implements。コンストラクタで `Observable<T>` を受け取り `store` プロパティで公開 | typecheck pass | - | 🟢 完了 |
| 1.2 | DI 登録をファクトリーパターンに変更 | `src/features/claude-code-integration/di-config.ts` の 12 個の Get UseCase 登録を、`ObservableQueryUseCase` を使ったファクトリー形式に置換 | typecheck pass、ViewModel 側のコード変更不要 | 1.1 | 🟢 完了 |
| 1.3 | 旧 Get UseCase 12 ファイルを削除 | `application/usecases/get-*-usecase.ts` （12 ファイル）を削除。`di-tokens.ts` の Token はそのまま維持 | grep で参照が残っていないこと | 1.2 | 🟢 完了 |

### Phase 2: R-03 (OutputParser 分離)

| # | タスク | 説明 | 完了条件 | 依存 | ステータス |
|:---|:---|:---|:---|:---|:---|
| 2.1 | `output_parser.rs` 新規作成 | `src-tauri/src/features/claude_code_integration/infrastructure/output_parser.rs` を新規作成。`parse_auth_status` / `parse_commit_message` / `build_review_result` / `build_explain_result` / `build_conflict_resolve_result` を public 関数として実装 | `cargo build` pass | - | 🟢 完了 |
| 2.2 | `claude_repository.rs` からインライン実装を削除 | `DefaultClaudeRepository` 内の解析ロジックを `output_parser` 呼び出しに置換 | `cargo build` pass、既存テスト pass | 2.1 | 🟢 完了 |
| 2.3 | `output_parser` のユニットテスト追加 | サンプル CLI 出力からの抽出を `#[cfg(test)]` で検証（12 ケース） | `cargo test` pass | 2.1 | 🟢 完了 |
| 2.4 | `infrastructure/mod.rs` で公開 | `pub mod output_parser` を追加 | `cargo build` pass | 2.1 | 🟢 完了 |

### Phase 3: R-04 (Prompt Builder 分離)

| # | タスク | 説明 | 完了条件 | 依存 | ステータス |
|:---|:---|:---|:---|:---|:---|
| 3.1 | `infrastructure/prompts/` モジュール作成 | `prompts/mod.rs` / `prompts/commit_message.rs` / `prompts/review.rs` / `prompts/explain.rs` / `prompts/conflict_resolve.rs` を新規作成。各ファイルは `pub fn build_*_prompt(...)` を公開する純粋関数のみ | `cargo build` pass | - | 🟢 完了 |
| 3.2 | `claude_repository.rs` からプロンプト構築コードを削除 | プロンプト構築呼び出しを `prompts::*` モジュール経由に変更 | `cargo build` pass | 3.1 | 🟢 完了 |
| 3.3 | プロンプトのスナップショットテスト追加 | 主要なプロンプト出力を `#[cfg(test)]` で検証（7 ケース） | `cargo test` pass | 3.1 | 🟢 完了 |
| 3.4 | `infrastructure/mod.rs` で公開 | `pub mod prompts` を追加 | `cargo build` pass | 3.1 | 🟢 完了 |

### Phase 4: R-02 (Service 分割) — **次セッションで実施**

| # | タスク | 説明 | 完了条件 | 依存 | ステータス |
|:---|:---|:---|:---|:---|:---|
| 4.1 | `ChatHistoryService` IF・実装作成 | `application/services/chat-history-service-interface.ts` と `chat-history-service.ts` を新規作成。`chatMessages$` / `conversations$` / `currentConversationId$` と関連メソッドを移管 | typecheck pass | - | ⏸ 持ち越し |
| 4.2 | `ClaudeStateService` IF・実装作成 | 残りの状態管理を移管（currentSession$ / status$ / outputs$ / isCommandRunning$ / selectedModel$ / 各種 review/explain/conflict 状態） | typecheck pass | - | ⏸ 持ち越し |
| 4.3 | UseCase の依存付け替え | 操作系 UseCase 10 個と状態取得系の DI 登録を、新しい Service に振り分け | typecheck pass、既存テスト pass | 4.1, 4.2 | ⏸ 持ち越し |
| 4.4 | DI Token・登録の更新 | `di-tokens.ts` に新 Service の Token を追加。`di-config.ts` で登録 | typecheck pass | 4.1, 4.2 | ⏸ 持ち越し |
| 4.5 | 旧 `ClaudeDefaultService` 削除 | `claude-service.ts` / `claude-service-interface.ts` を削除。残参照を grep で確認 | grep で参照なし | 4.3, 4.4 | ⏸ 持ち越し |

### Phase 5: 検証

| # | タスク | 説明 | 完了条件 | 依存 | ステータス |
|:---|:---|:---|:---|:---|:---|
| 5.1 | フロント検証 | `npm run lint`、`npm run typecheck`、`npm run test` を実行 | 全て pass | 1.x | 🟢 完了 |
| 5.2 | バック検証 | `cd src-tauri && cargo build` と `cargo test` を実行 | 全て pass | 2.x, 3.x | 🟢 完了 |
| 5.3 | コミット | R-01/R-03/R-04 + ドキュメント変更をコミット。コミットメッセージは設計書 §11 へのリンクを含める | git log に反映 | 5.1, 5.2 | 進行中 |
| 5.4 | push | `git push -u origin claude/refactor-ai-tools-sdd-USuj0` | リモートに反映 | 5.3 | 未実施 |

## 実施順序

設計書 §11.4 に従い R-01 → R-03 → R-04 の順で完了。R-02 は次セッションで focused に実施する。

## ロールバック方針

各項目は独立コミットに分割するため、問題発生時は該当項目のコミットのみ revert する。R-02 開始時は本タスクログを更新する。

## 完了後の処理

R-02 実装完了時に本 task ディレクトリを削除し、重要な設計判断は設計書 §11 に統合済みであることを確認する（AI-SDD 原則: Knowledge Asset Persistence）。それまでは R-02 残タスクの進捗管理に本ファイルを利用する。

