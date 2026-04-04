# 品質チェックリスト: 高度な Git 操作

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | 高度な Git 操作 (Advanced Git Operations) |
| 対象仕様書 | `.sdd/specification/advanced-git-operations_spec.md` |
| 対象設計書 | `.sdd/specification/advanced-git-operations_design.md` |
| 対象 PRD | `.sdd/requirement/advanced-git-operations.md` |
| 生成日 | 2026-04-04 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 8 | 6 | 2 | 0 |
| 仕様レビュー | 6 | 4 | 2 | 0 |
| 設計レビュー | 7 | 4 | 3 | 0 |
| 実装レビュー | 8 | 5 | 3 | 0 |
| テストレビュー | 7 | 4 | 3 | 0 |
| セキュリティレビュー | 4 | 3 | 1 | 0 |
| パフォーマンスレビュー | 4 | 2 | 2 | 0 |
| **合計** | **44** | **28** | **16** | **0** |

**優先度レベル**:

- **P1**: マージ前に必須
- **P2**: リリース前に完了すべき
- **P3**: あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P1] - マージ機能（FR_401）

- [ ] マージ対象ブランチの選択 UI が提供されている（FR_401_01）
- [ ] マージ方式（fast-forward / no-ff）の選択が提供されている（FR_401_02）
- [ ] マージ実行と結果（成功/コンフリクト/already-up-to-date）の表示が行われる（FR_401_03）
- [ ] マージの中止（`git merge --abort`）が提供されている（FR_401_04）
- [ ] コンフリクト発生時にコンフリクト解決 UI へ遷移する（FR_401_05）

**検証方法**: MergeDialog でブランチ選択→方式選択→マージ実行→結果確認の一連フローを手動テスト

---

### CHK-102 [P1] - コンフリクト解決機能（FR_405）

- [ ] コンフリクトファイルの一覧表示が提供されている（FR_405_01）
- [ ] 3 ウェイマージ表示（ours / theirs / merged result）が提供されている（FR_405_02）
- [ ] ours（自分の変更）の一括採用が提供されている（FR_405_03）
- [ ] theirs（相手の変更）の一括採用が提供されている（FR_405_04）
- [ ] 手動編集による解決が提供されている（FR_405_05）
- [ ] 解決済みファイルのマーク（`git add`）が提供されている（FR_405_06）
- [ ] 全コンフリクト解決後のマージ/リベース続行が提供されている（FR_405_07）

**検証方法**: コンフリクトを意図的に発生させ、3 ウェイ表示→解決→続行の一連フローを手動テスト

---

### CHK-103 [P1] - リベース機能（FR_402）

- [ ] リベース対象ブランチの選択 UI が提供されている（FR_402_01）
- [ ] インタラクティブリベースのコミット一覧表示が提供されている（FR_402_02）
- [ ] コミットの並べ替え・squash・edit・drop 操作が提供されている（FR_402_03）
- [ ] リベースの実行と進行状況表示が行われる（FR_402_04）
- [ ] リベースの中止（`git rebase --abort`）が提供されている（FR_402_05）

**検証方法**: RebaseEditor でコミット並べ替え→squash→実行→完了の一連フローを手動テスト

---

### CHK-104 [P1] - スタッシュ機能（FR_403）

- [ ] 現在の変更をスタッシュに退避する（メッセージ付き）（FR_403_01）
- [ ] スタッシュ一覧の表示（メッセージ、日時）（FR_403_02）
- [ ] スタッシュの復元（pop / apply）が提供されている（FR_403_03）
- [ ] スタッシュの個別削除（drop）が提供されている（FR_403_04）
- [ ] スタッシュの全削除（clear、確認ダイアログ付き）が提供されている（FR_403_05）

**検証方法**: StashManager で save→list→pop/apply→drop→clear の一連フローを手動テスト

---

### CHK-105 [P2] - チェリーピック機能（FR_404）

- [ ] コミットログからのコミット選択が提供されている（FR_404_01）
- [ ] 単一コミットのチェリーピックが提供されている（FR_404_02）
- [ ] 複数コミットの一括チェリーピックが提供されている（FR_404_03）
- [ ] コンフリクト発生時のコンフリクト解決 UI への遷移が提供されている（FR_404_04）

**検証方法**: CherryPickDialog でコミット選択→チェリーピック実行を手動テスト

---

### CHK-106 [P2] - タグ管理機能（FR_406）

- [ ] lightweight タグの作成が提供されている（FR_406_01）
- [ ] annotated タグの作成（メッセージ付き）が提供されている（FR_406_02）
- [ ] タグの削除が確認ダイアログ付きで提供されている（FR_406_03）
- [ ] タグ一覧の表示（名前、対象コミット、日時）が提供されている（FR_406_04）

**検証方法**: TagManager でタグ作成→一覧→削除の一連フローを手動テスト

---

### CHK-107 [P1] - 操作中止保証（DC_401）

- [ ] マージ中は abort オプションが常に UI に表示されている
- [ ] リベース中は abort オプションが常に UI に表示されている
- [ ] チェリーピック中は abort オプションが常に UI に表示されている
- [ ] abort 実行後、操作前の状態に戻れることが保証されている

**検証方法**: 各操作中に abort ボタンの表示を確認。abort 後の git status で操作前の状態を確認

---

### CHK-108 [P1] - 進捗フィードバック（NFR_401）

- [ ] マージ・リベース操作の進行状況が 500ms 以内にフィードバックされる
- [ ] 操作完了が 30 秒以内に通知される
- [ ] 長時間操作の場合は進捗インジケーターが表示される

**検証方法**: 大規模リポジトリでマージ・リベースを実行し、進捗表示のタイミングを計測

---

## 2. 仕様レビュー

### CHK-201 [P1] - IPC API の完全性

- [ ] spec で定義された 24 IPC チャネルがすべて実装されている
- [ ] 各チャネルの引数の型が spec と一致している
- [ ] 各チャネルの戻り値の型が spec と一致している
- [ ] `git:progress` イベントで進捗通知が正しく送信される

**検証方法**: `npm run typecheck` + IPC チャネル登録数の確認

---

### CHK-202 [P1] - データモデルの整合性

- [ ] spec セクション 4.3 の全型定義が `src/domain/index.ts` に実装されている
- [ ] 各 interface のフィールドが spec と完全一致している
- [ ] union 型（`ConflictResolution`, `RebaseAction`）が正しく定義されている
- [ ] optional フィールド（`commitHash?`, `message?`）が適切に処理されている

**検証方法**: spec と domain 型定義を diff 比較

---

### CHK-203 [P1] - 振る舞いフローの実装

- [ ] マージ実行フロー（spec セクション 7.1）に従っている
- [ ] コンフリクト解決フロー（spec セクション 7.2）に従っている
- [ ] インタラクティブリベースフロー（spec セクション 7.3）に従っている
- [ ] エラー発生時の分岐が spec のシーケンス図と一致している

**検証方法**: 各フローの主要パス + エラーパスを手動テスト

---

### CHK-204 [P1] - コンポーネント Props の実装

- [ ] spec セクション 4.2 の全コンポーネント Props が実装されている
- [ ] Props の型が spec と一致している（ViewModel + Hook 経由での提供に読み替え）

**検証方法**: `npm run typecheck`

---

### CHK-205 [P2] - 制約事項の遵守

- [ ] レンダラーから Node.js API に直接アクセスしていない（原則 A-001）
- [ ] Git 操作は必ずメインプロセスで実行されている（原則 A-001）
- [ ] IPC 通信は型安全なインターフェースを経由している
- [ ] 不可逆な操作には確認ダイアログが表示されている（原則 B-002）
- [ ] force push はスコープ外として実装されていない

**検証方法**: コードレビュー + `npm run lint`

---

### CHK-206 [P2] - 用語の一貫性

- [ ] コード内の用語が spec セクション 5 の用語集と一致している
- [ ] UI 表示テキストが用語集の定義に従っている

**検証方法**: コードレビュー

---

## 3. 設計レビュー

### CHK-301 [P1] - Clean Architecture 4層構成

- [ ] メインプロセス側のディレクトリ構成が design セクション 4.1 と一致している
- [ ] レンダラー側のディレクトリ構成が design セクション 4.1 と一致している
- [ ] 依存方向が `domain ← application ← infrastructure / presentation` の一方向のみ
- [ ] domain / application 層がフレームワーク非依存の純粋 TypeScript で実装されている

**検証方法**: ディレクトリ構造の確認 + import 文の依存方向チェック

---

### CHK-302 [P1] - DI パターンの適用

- [ ] `di-tokens.ts` に全トークン + UseCase 型エイリアスが定義されている
- [ ] `di-config.ts` が useClass + deps パターンで統一されている
- [ ] `src/processes/main/di/configs.ts` に `advancedGitOperationsMainConfig` が追加されている
- [ ] `src/processes/renderer/di/configs.ts` に `advancedGitOperationsConfig` が追加されている
- [ ] ViewModel が transient で登録されている

**検証方法**: DI 設定ファイルの確認 + `npm run typecheck`

---

### CHK-303 [P1] - ViewModel + Hook パターン

- [ ] 6 ViewModel が純粋 TypeScript クラスとして実装されている
- [ ] ViewModel が UseCase のみを参照している（A-004 準拠、Service/Repository を直接参照していない）
- [ ] Hook ラッパーが `useResolve` + `useObservable` パターンを使用している
- [ ] Observable プロパティが constructor でフィールドとして 1 回だけ生成されている

**検証方法**: ViewModel のコンストラクタ引数と import 文を確認

---

### CHK-304 [P1] - UseCase 1クラス1操作の遵守

- [ ] メインプロセス側の 24 UseCase がそれぞれ 1 操作のみを提供している
- [ ] レンダラー側の ~28 UseCase がそれぞれ 1 操作のみを提供している
- [ ] 各 UseCase が `ConsumerUseCase` / `FunctionUseCase` / `ObservableStoreUseCase` を implements している

**検証方法**: UseCase ファイル数と implements 宣言を確認

---

### CHK-305 [P2] - 命名規則の遵守

- [ ] ステートレスな Git CLI ラッパーが「Repository」と命名されている（`GitAdvancedRepository`）
- [ ] ステートフルな状態管理クラスのみ「Service」と命名されている（`AdvancedOperationsService`）
- [ ] エラーコードがドメインプレフィックス付き（`MERGE_FAILED`, `REBASE_CONFLICT` 等）

**検証方法**: クラス名とエラーコード定数を grep

---

### CHK-306 [P2] - 技術スタックの準拠

- [ ] Git 操作に simple-git を使用している
- [ ] コンフリクト解決エディタに Monaco Editor（@monaco-editor/react）を使用している
- [ ] コミット並べ替えに @dnd-kit/core を使用している
- [ ] 未承認の依存関係が追加されていない

**検証方法**: package.json の依存関係を確認

---

### CHK-307 [P2] - 設計判断の文書化

- [ ] design セクション 9.1 の全決定事項が実装に反映されている
- [ ] 実装時に新たに発生した設計判断が design に追記されている

**検証方法**: design セクション 9 と実装を比較

---

## 4. 実装レビュー

### CHK-401 [P1] - IPC Handler パターン

- [ ] `registerGitAdvancedIPCHandlers` が `wrapHandler` + `validatePath` パターンを使用している
- [ ] 全チャネルで `worktreePath` のバリデーションが行われている
- [ ] エラーが `GitOperationError` → `ipcFailure(error.code, error.message)` にマッピングされている
- [ ] Handler 登録関数がクリーンアップ関数（`removeHandler`）を返している

**検証方法**: ipc-handlers.ts のコードレビュー

---

### CHK-402 [P1] - レンダラー UseCase のエラーハンドリング

- [ ] 各 UseCase が `service.setLoading(true/false)` で loading 状態を管理している
- [ ] エラー発生時に `service.setError()` でエラー状態を設定している
- [ ] `finally` ブロックで `setLoading(false)` が確実に呼ばれている

**検証方法**: UseCase 実装のコードレビュー

---

### CHK-403 [P1] - AdvancedOperationsService の状態管理

- [ ] `loading$`, `lastError$`, `operationProgress$`, `currentOperation$` が BehaviorSubject で管理されている
- [ ] `setUp()` で初期化、`tearDown()` で全 BehaviorSubject が complete されている
- [ ] Observable プロパティが `asObservable()` で公開されている

**検証方法**: Service 実装のコードレビュー

---

### CHK-404 [P1] - インタラクティブリベースの実装

- [ ] `GIT_SEQUENCE_EDITOR` 環境変数を利用してリベースが実装されている
- [ ] 一時ファイルとしてエディタスクリプトが生成されている
- [ ] リベース完了後に一時ファイルが削除されている

**検証方法**: リベース実装のコードレビュー + 手動テスト

---

### CHK-405 [P1] - 3 ウェイマージ表示の実装

- [ ] `git show :1:`, `:2:`, `:3:` で base/ours/theirs を正しく取得している
- [ ] Monaco Editor の DiffEditor 2 つ + 結果エディタの 3 パネル構成で表示されている
- [ ] 手動編集の結果がファイルに書き込まれ `git add` で解決済みマークされている

**検証方法**: ConflictResolver + ThreeWayMergeView の手動テスト

---

### CHK-406 [P2] - ConflictViewModel の独立性

- [ ] ConflictViewModel が MergeViewModel / RebaseViewModel と直接依存していない
- [ ] コンポーネント層で `status: 'conflict'` に基づいて表示切り替えが行われている
- [ ] 解決完了後にコンポーネント側から `rebaseContinue()` が呼び出されている

**検証方法**: ViewModel の import 文と Props のデータフローを確認

---

### CHK-407 [P2] - 操作完了後のリフレッシュ

- [ ] マージ・リベース・チェリーピック完了後に `git:status` / `git:branches` が呼び出されている
- [ ] スタッシュ操作後にスタッシュ一覧が更新されている

**検証方法**: 各操作の完了コールバックを確認

---

### CHK-408 [P2] - ConfirmDialog の再利用

- [ ] スタッシュ全削除（clear）で ConfirmDialog が表示されている
- [ ] タグ削除で ConfirmDialog が表示されている
- [ ] リベース abort で ConfirmDialog が表示されている
- [ ] basic-git-operations の既存 ConfirmDialog を再利用している（新規コンポーネント不要）

**検証方法**: 破壊的操作の手動テスト

---

## 5. テストレビュー

### CHK-501 [P1] - メインプロセス ユニットテスト

- [ ] GitAdvancedDefaultRepository のテストカバレッジ ≥ 80%
- [ ] 24 UseCases のテストが存在する
- [ ] IPC Handler のバリデーション・ルーティングテストが存在する
- [ ] simple-git がモックされている

**検証方法**: `npm run test` + カバレッジレポート確認

---

### CHK-502 [P1] - レンダラー ユニットテスト

- [ ] 6 ViewModel のテストが存在する
- [ ] AdvancedOperationsService の状態管理テストが存在する
- [ ] テストカバレッジ ≥ 60%
- [ ] Repository と Service がモックされている

**検証方法**: `npm run test` + カバレッジレポート確認

---

### CHK-503 [P1] - 結合テスト

- [ ] マージ→コンフリクト解決→続行の E2E フローがテストされている
- [ ] スタッシュ save→list→pop の E2E フローがテストされている
- [ ] IPC 通信フロー（main ↔ preload ↔ renderer）がテストされている

**検証方法**: `npm run test` で結合テストが全パス

---

### CHK-504 [P1] - エッジケーステスト

- [ ] コンフリクトファイルが 0 件の場合のハンドリングがテストされている
- [ ] 空のスタッシュ一覧のハンドリングがテストされている
- [ ] 進行中の操作（マージ/リベース）がある状態での新規操作の拒否がテストされている
- [ ] worktreePath が不正な場合のバリデーションがテストされている

**検証方法**: テストコードのエッジケースカバレッジ確認

---

### CHK-505 [P2] - エラーパステスト

- [ ] `MERGE_FAILED` エラーのハンドリングがテストされている
- [ ] `REBASE_CONFLICT` エラーのハンドリングがテストされている
- [ ] `STASH_FAILED` エラーのハンドリングがテストされている
- [ ] ネットワークエラー（simple-git タイムアウト）のハンドリングがテストされている

**検証方法**: テストコードのエラーパスカバレッジ確認

---

### CHK-506 [P2] - DnD 操作テスト

- [ ] @dnd-kit/core によるコミット並べ替えがテストされている
- [ ] キーボード操作（上下ボタン）によるコミット並べ替えがテストされている
- [ ] アクション変更（pick → squash → drop）がテストされている

**検証方法**: RebaseEditor のテストコード確認

---

### CHK-507 [P2] - CI チェック

- [ ] `npm run typecheck` がパス
- [ ] `npm run lint` がパス
- [ ] `npm run format:check` がパス
- [ ] `npm run test` が全テストパス

**検証方法**: 各コマンドの実行

---

## 6. セキュリティレビュー

### CHK-601 [P1] - パストラバーサル防止

- [ ] `validatePath` で `..` を含むパスが拒否されている
- [ ] worktreePath のバリデーションが全 IPC チャネルで実施されている
- [ ] ファイルパス（conflictFileContent, conflictResolve）のバリデーションが実施されている

**検証方法**: IPC Handler のバリデーションコード確認

---

### CHK-602 [P1] - GIT_SEQUENCE_EDITOR の安全性

- [ ] 一時ファイルのパスが安全（予測不能な名前、適切な権限）
- [ ] 一時ファイルがリベース完了/中止後に確実に削除される
- [ ] 外部入力がエディタスクリプトに直接注入されない

**検証方法**: インタラクティブリベース実装のセキュリティレビュー

---

### CHK-603 [P1] - IPC チャネルの型安全性

- [ ] IPC チャネル名がハードコードではなく型定義から導出されている
- [ ] `IPCResult<T>` パターンで統一されている
- [ ] エラーコードが適切に分類されている

**検証方法**: `src/lib/ipc.ts` と IPC Handler の型整合性確認

---

### CHK-604 [P2] - コンフリクト解決の安全性

- [ ] 手動編集で任意のファイル内容が書き込まれる際、対象ファイルが worktree 内に限定されている
- [ ] `conflictMarkResolved` が `git add` のみを実行している（他の操作を含まない）

**検証方法**: ConflictService 実装のセキュリティレビュー

---

## 7. パフォーマンスレビュー

### CHK-701 [P1] - 進捗フィードバック遅延

- [ ] simple-git の progress イベントが 500ms 以内にレンダラーに転送されている
- [ ] `git:progress` IPC イベントの送信がブロッキングしていない

**検証方法**: 大規模リポジトリでの進捗表示タイミング計測

---

### CHK-702 [P1] - コンフリクトファイルの遅延ロード

- [ ] コンフリクトファイル一覧は filePath のみ取得（内容は取得しない）
- [ ] ファイル内容はユーザーがファイル選択時にのみ取得される
- [ ] 大量コンフリクト時（10+ ファイル）でも UI がフリーズしない

**検証方法**: 10+ コンフリクトファイルでの動作確認

---

### CHK-703 [P2] - Monaco Editor のメモリ使用量

- [ ] Monaco Editor インスタンスが不要時に破棄されている
- [ ] 大きなファイル（10000+ 行）でのコンフリクト解決が可能
- [ ] コンフリクト解決完了後にエディタリソースが解放されている

**検証方法**: メモリプロファイリング

---

### CHK-704 [P2] - スタッシュ一覧のパフォーマンス

- [ ] 大量スタッシュ（50+）でも一覧表示が 3 秒以内
- [ ] スタッシュのプレビュー情報は遅延取得されている

**検証方法**: 50+ スタッシュでの一覧表示速度計測

---

## 完了基準

### PR 作成前チェックリスト

- [ ] すべての P1 項目がチェック済み
- [ ] `npm run typecheck` がパス
- [ ] `npm run lint` がパス
- [ ] `npm run test` が全テストパス

### マージ前チェックリスト

- [ ] すべての P1 項目がチェック済み
- [ ] すべての P2 項目がチェック済み
- [ ] コードレビュー承認済み

---

## 参照ドキュメント

- PRD: [advanced-git-operations.md](../../requirement/advanced-git-operations.md)
- 抽象仕様書: [advanced-git-operations_spec.md](../../specification/advanced-git-operations_spec.md)
- 技術設計書: [advanced-git-operations_design.md](../../specification/advanced-git-operations_design.md)
- タスク分解: [tasks.md](./tasks.md)
