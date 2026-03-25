# 品質チェックリスト: アプリケーション基盤

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | アプリケーション基盤 (application-foundation) |
| チケット番号 | application-foundation |
| 対象仕様書 | `.sdd/specification/application-foundation_spec.md` |
| 対象設計書 | `.sdd/specification/application-foundation_design.md` |
| 生成日 | 2026-03-26 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 8 | 5 | 3 | 0 |
| 仕様レビュー | 7 | 4 | 3 | 0 |
| 設計レビュー | 6 | 4 | 2 | 0 |
| 実装レビュー | 7 | 4 | 3 | 0 |
| テストレビュー | 6 | 3 | 2 | 1 |
| ドキュメントレビュー | 3 | 1 | 2 | 0 |
| セキュリティレビュー | 5 | 4 | 1 | 0 |
| パフォーマンスレビュー | 4 | 1 | 2 | 1 |
| デプロイレビュー | 3 | 1 | 2 | 0 |
| **合計** | **49** | **27** | **20** | **2** |

**優先度レベル**:

- **P1**: 高 — マージ前に完了すべき
- **P2**: 中 — リリース前に完了すべき
- **P3**: 低 — あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P1] - リポジトリ管理要件 (FR_601, FR_602)

- [ ] FR-001: ネイティブフォルダ選択ダイアログでリポジトリを開ける
- [ ] FR-002: 選択フォルダの Git リポジトリ検証（`git rev-parse --is-inside-work-tree`）
- [ ] FR-004: 最近開いたリポジトリ履歴の永続保持（最大20件）
- [ ] FR-005: 履歴からのクイックオープン
- [ ] FR-006: リポジトリのピン留め/解除

**検証方法**: `npm run test` で UseCase テストを確認。手動で dialog 動作を確認

---

### CHK-102 [P1] - 設定管理要件 (FR_603)

- [ ] FR-007: テーマ切り替え（light/dark/system）
- [ ] FR-008: Git 実行パスのカスタム設定
- [ ] FR-009: デフォルト作業ディレクトリ設定
- [ ] FR-010: 設定の永続化と起動時リストア

**検証方法**: SettingsService / SettingsViewModel のテストを確認

---

### CHK-103 [P1] - IPC 通信基盤要件 (FR_604)

- [ ] FR-011: contextBridge 経由の型安全 API 公開
- [ ] FR-012: リクエスト/レスポンス型 IPC 通信（`ipcMain.handle` / `ipcRenderer.invoke`）
- [ ] FR-013: メイン→レンダラーのイベント通知（`error:notify`）

**検証方法**: `npm run typecheck` で型安全性を確認。preload.ts / ipc-handlers.ts を検査

---

### CHK-104 [P1] - エラーハンドリング要件 (FR_605)

- [ ] FR-014: エラー通知のトースト表示（Sonner）
- [ ] FR-015: エラー重大度分類（info/warning/error）
- [ ] FR-018: IPC 通信エラーの統一ハンドリング（`IPCResult<T>`）

**検証方法**: ErrorNotificationService / ViewModel のテストを確認

---

### CHK-105 [P1] - エラーリカバリ要件

- [ ] FR-016: リトライ機能（RetryErrorUseCase）
- [ ] FR-017: エラー詳細の展開表示

**検証方法**: UseCase テストを確認

---

### CHK-106 [P2] - 非機能要件 (NFR)

- [ ] NFR-001: アプリ起動から UI 表示まで3秒以内
- [ ] NFR-002: IPC 通信ラウンドトリップ 50ms 以内

**検証方法**: 実アプリでの手動計測、パフォーマンスプロファイリング

---

### CHK-107 [P2] - 設計制約 (DC)

- [ ] DC-001: Electron セキュリティ準拠（nodeIntegration: false, contextIsolation: true）
- [ ] DC-002: データ永続化がローカルファイルシステムのみ（electron-store）

**検証方法**: forge.config.ts の FusesPlugin 設定を検査、外部通信がないことを確認

---

### CHK-108 [P2] - FR-003: 画面遷移

- [ ] リポジトリオープン後にワークツリー一覧画面へ遷移する

**検証方法**: 手動テスト（ワークツリー管理 feature との結合後に検証）

---

## 2. 仕様レビュー

### CHK-201 [P1] - IPC API 完全性

- [ ] 仕様書 § 4.1 の全 IPC チャネル（10チャネル + 1イベント）が実装されている
- [ ] `repository:open`, `repository:open-path`, `repository:validate`, `repository:get-recent`, `repository:remove-recent`, `repository:pin`
- [ ] `settings:get`, `settings:set`, `settings:get-theme`, `settings:set-theme`
- [ ] `error:notify`（main → renderer）

**検証方法**: `src/preload.ts` と `infrastructure/main/ipc-handlers.ts` を確認

---

### CHK-202 [P1] - UseCase / Repository IF の一致

- [ ] 仕様書 § 4.2 の RepositoryRepository IF が実装と一致
- [ ] 仕様書 § 4.2 の SettingsRepository IF が実装と一致
- [ ] 全 UseCase 型（10種）が実装と一致

**検証方法**: `/check-spec application-foundation` を実行

---

### CHK-203 [P1] - ViewModel IF の一致

- [ ] 仕様書 § 4.3 の RepositorySelectorViewModel IF が実装と一致
- [ ] 仕様書 § 4.3 の SettingsViewModel IF が実装と一致
- [ ] 仕様書 § 4.3 の ErrorNotificationViewModel IF が実装と一致

**検証方法**: di-tokens.ts の IF 定義と presentation 層の実装を比較

---

### CHK-204 [P1] - データモデルの整合性

- [ ] 仕様書 § 4.4 の型定義（RepositoryInfo, RecentRepository, AppSettings, Theme, ErrorNotification, ErrorSeverity, IPCResult, IPCError）が実装と一致
- [ ] DEFAULT_SETTINGS のデフォルト値が仕様と一致（theme: 'system', gitPath: null, defaultWorkDir: null）

**検証方法**: `src/features/application-foundation/domain/index.ts` と `src/types/ipc.ts` を確認

---

### CHK-205 [P2] - シーケンスフローの整合性

- [ ] 仕様書 § 7.1 リポジトリオープンフローに従っている
- [ ] 仕様書 § 7.2 エラー通知フローに従っている
- [ ] 仕様書 § 7.3 設定変更フローに従っている

**検証方法**: 結合テストのフロー検証、コードトレース

---

### CHK-206 [P2] - 制約事項の準拠

- [ ] レンダラーから Node.js API に直接アクセスしていない
- [ ] IPC 通信は infrastructure 層に閉じている
- [ ] domain / application 層がフレームワーク非依存

**検証方法**: import 文の検査、ESLint ルールで確認

---

### CHK-207 [P2] - 仕様と実装の型差異

- [ ] ErrorNotification に `title` フィールドがあるか（仕様 § 4.4 では定義あり、実装で確認が必要）
- [ ] ErrorNotification に `retryable` / `retryAction` フィールドがあるか（仕様 § 4.4 では定義あり）

**検証方法**: domain/index.ts の ErrorNotification 型を仕様と比較

---

## 3. 設計レビュー

### CHK-301 [P1] - Clean Architecture 4層構造

- [ ] `domain/` — 純粋 TypeScript、外部ライブラリ依存なし
- [ ] `application/` — UseCase + Service + Repository IF、RxJS のみ許可
- [ ] `infrastructure/` — IPC 通信、electron-store アクセス
- [ ] `presentation/` — ViewModel + Hook ラッパー

**検証方法**: ディレクトリ構造と import 文を確認

---

### CHK-302 [P1] - 依存方向の正しさ

- [ ] domain ← application ← infrastructure の一方向
- [ ] domain ← application ← presentation の一方向
- [ ] infrastructure → domain の直接参照がない
- [ ] presentation → infrastructure の直接参照がない

**検証方法**: import 文を grep で確認

---

### CHK-303 [P1] - DI コンテナ登録

- [ ] Service が singleton で登録されている
- [ ] Repository 実装が singleton で登録されている
- [ ] UseCase が singleton で登録されている
- [ ] ViewModel が transient で登録されている（設計判断 § 9.1）

**検証方法**: `di-config.ts` の register 関数を確認

---

### CHK-304 [P1] - メインプロセス構成

- [ ] メインプロセス側は infrastructure 層のみ（設計判断 § 9.1）
- [ ] RepositoryMainService と SettingsMainService が分離されている
- [ ] IPC ハンドラーが registerIPCHandlers で一括登録されている

**検証方法**: `infrastructure/main/` のファイル構成を確認

---

### CHK-305 [P2] - RxJS パターン

- [ ] Service が BehaviorSubject で状態を管理している
- [ ] asObservable() で外部に公開している（直接 Subject を公開していない）
- [ ] dispose() で BehaviorSubject を complete している

**検証方法**: application 層の Service 実装を確認

---

### CHK-306 [P2] - electron-store の抽象化

- [ ] AppStore インターフェースで electron-store を抽象化している
- [ ] メインプロセス Service が AppStore IF に依存している（具象クラスに直接依存していない）

**検証方法**: `store-schema.ts` の AppStore IF と Service のコンストラクタを確認

---

## 4. 実装レビュー

### CHK-401 [P1] - コード構造・命名規約

- [ ] ファイル名がケバブケース（例: `repository-service.ts`）
- [ ] クラス名がパスカルケース（例: `RepositoryService`）
- [ ] DI トークンがパスカルケース + Token サフィックス（例: `RepositoryServiceToken`）
- [ ] Hook が `use` プレフィックス（例: `useRepositorySelectorViewModel`）

**検証方法**: `npm run lint`

---

### CHK-402 [P1] - IPCResult 型の一貫したエラーハンドリング

- [ ] レンダラー側 Repository 実装で `result.success === false` による型ナローイングを使用
- [ ] エラー時は `throw new Error(result.error.message)` でエラーを伝搬
- [ ] サイレント失敗がない

**検証方法**: `infrastructure/repository-repository-impl.ts`, `infrastructure/settings-repository-impl.ts` を確認

---

### CHK-403 [P1] - UseCase のエラーハンドリング

- [ ] OpenRepositoryUseCase がリポジトリ open 失敗時に ErrorNotificationService に通知
- [ ] OpenRepositoryByPathUseCase が同様にエラー通知
- [ ] エラーが静かに握りつぶされていない

**検証方法**: UseCase 実装のエラーハンドリングパスを確認

---

### CHK-404 [P1] - setUp の初期データロード

- [ ] setUp で settingsRepo.get() と repoRepo.getRecent() を並列実行
- [ ] ロード結果を settingsService.replaceSettings と repoService.updateRecentRepositories に反映
- [ ] tearDown で全 Service の dispose() を呼び出し

**検証方法**: `di-config.ts` の setUp 関数を確認、結合テストで検証

---

### CHK-405 [P2] - Hook ラッパーの実装品質

- [ ] useCallback でコールバックをメモ化している
- [ ] useObservable で Observable → React state 変換
- [ ] useResolve で DI コンテナからサービス解決

**検証方法**: presentation 層の Hook ファイルを確認

---

### CHK-406 [P2] - メインプロセス Service の Git 検証

- [ ] `execFile('git', ['rev-parse', '--is-inside-work-tree'])` で検証
- [ ] コマンドインジェクション対策（`execFile` を使用、`exec` ではない）
- [ ] 最大履歴件数の制限（MAX_RECENT = 20）

**検証方法**: `infrastructure/main/repository-main-service.ts` を確認

---

### CHK-407 [P2] - デッドコード・不要な import

- [ ] 未使用の import がない
- [ ] コメントアウトされたコードがない
- [ ] `npm run lint` がエラーなしで通過

**検証方法**: `npm run lint`

---

## 5. テストレビュー

### CHK-501 [P1] - Application 層ユニットテスト

- [ ] RepositoryService テスト（状態の get/set/Observable emit）
- [ ] SettingsService テスト（設定の get/update/Observable emit）
- [ ] ErrorNotificationService テスト（通知の追加/削除/Observable emit）
- [ ] UseCase テスト（10種すべて、モック Repository/Service 使用）

**検証方法**: `npx vitest run src/features/application-foundation/application`

---

### CHK-502 [P1] - Presentation 層ユニットテスト

- [ ] RepositorySelectorViewModel テスト（Observable emit、UseCase 呼び出し）
- [ ] SettingsViewModel テスト（Observable emit、UseCase 呼び出し）
- [ ] ErrorNotificationViewModel テスト（Observable emit、UseCase 呼び出し）

**検証方法**: `npx vitest run src/features/application-foundation/presentation`

---

### CHK-503 [P1] - 結合テスト

- [ ] DI コンテナから全サービスが解決可能
- [ ] ViewModel が transient で毎回新しいインスタンス
- [ ] setUp で初期データロード
- [ ] リポジトリオープン → Service 更新フロー
- [ ] 設定更新フロー
- [ ] エラー通知追加・削除フロー

**検証方法**: `npx vitest run src/features/application-foundation/__tests__/integration`

---

### CHK-504 [P2] - テストカバレッジ

- [ ] application 層カバレッジ ≥ 80%
- [ ] presentation 層（ViewModel）カバレッジ ≥ 80%

**検証方法**: `npx vitest run --coverage`

---

### CHK-505 [P2] - エッジケーステスト

- [ ] null/undefined リポジトリの処理
- [ ] 空の履歴リスト
- [ ] リポジトリ open キャンセル（null 返却）
- [ ] 存在しないエラー ID の dismiss

**検証方法**: UseCase / Service テストのエッジケースを確認

---

### CHK-506 [P3] - Hook ラッパーテスト

- [ ] `renderHook` で useRepositorySelectorViewModel をテスト
- [ ] `renderHook` で useSettingsViewModel をテスト
- [ ] `renderHook` で useErrorNotificationViewModel をテスト

**検証方法**: `@testing-library/react` の `renderHook` を使用

---

## 6. ドキュメントレビュー

### CHK-601 [P1] - 設計書ステータスの更新

- [ ] `application-foundation_design.md` の実装ステータスが実装状況と一致
- [ ] 各モジュールのステータスが最新（🟢/🔴）

**検証方法**: 設計書と実際のファイル存在を比較

---

### CHK-602 [P2] - 実装ログの記録

- [ ] `implementation_progress.md` が作成されている（任意）
- [ ] 重要な設計判断が記録されている

**検証方法**: `.sdd/task/application-foundation/` を確認

---

### CHK-603 [P2] - tasks.md のステータス更新

- [ ] tasks.md の front matter status が更新されている

**検証方法**: `.sdd/task/application-foundation/tasks.md` を確認

---

## 7. セキュリティレビュー

### CHK-701 [P1] - Electron セキュリティ設定

- [ ] `nodeIntegration: false` が設定されている
- [ ] `contextIsolation: true` が設定されている
- [ ] FusesPlugin で `RunAsNode: false` が設定されている

**検証方法**: `forge.config.ts` を確認

---

### CHK-702 [P1] - contextBridge パターン

- [ ] レンダラーから `require('electron')` を直接使用していない
- [ ] 全 API が `contextBridge.exposeInMainWorld` 経由で公開されている
- [ ] preload で公開する API が最小限

**検証方法**: `src/preload.ts` を確認、レンダラーコードの import を検査

---

### CHK-703 [P1] - コマンドインジェクション対策

- [ ] Git コマンド実行に `execFile` を使用している（`exec` / `spawn` でシェル経由でない）
- [ ] ユーザー入力がコマンド引数に直接渡されていない、または適切にサニタイズされている

**検証方法**: `infrastructure/main/repository-main-service.ts` の execFile 呼び出しを確認

---

### CHK-704 [P1] - IPC チャネルの安全性

- [ ] IPC チャネルハンドラーで入力バリデーションが行われている
- [ ] 不正な IPC メッセージでクラッシュしない

**検証方法**: `infrastructure/main/ipc-handlers.ts` を確認

---

### CHK-705 [P2] - データ保護

- [ ] 機密データ（パスワード等）がストアに保存されていない
- [ ] electron-store のデータが適切な場所に保存されている

**検証方法**: `store-schema.ts` のスキーマを確認

---

## 8. パフォーマンスレビュー

### CHK-801 [P1] - 起動パフォーマンス (NFR-001)

- [ ] VContainerProvider の setUp が非同期で実行されている
- [ ] setUp 完了前に fallback UI が表示される
- [ ] 起動から UI 表示まで3秒以内

**検証方法**: アプリ起動の手動計測

---

### CHK-802 [P2] - IPC レイテンシ (NFR-002)

- [ ] IPC ハンドラーが軽量（重い処理をブロックしない）
- [ ] 不要な IPC ラウンドトリップがない

**検証方法**: パフォーマンスプロファイリング

---

### CHK-803 [P2] - RxJS Subscription リーク防止

- [ ] Service の dispose() で BehaviorSubject を complete
- [ ] VContainerProvider の tearDown で dispose が呼ばれる
- [ ] Hook の useEffect で subscription を unsubscribe

**検証方法**: `useObservable` の cleanup、Service の dispose、di-config の tearDown を確認

---

### CHK-804 [P3] - メモリ使用量

- [ ] 最近のリポジトリ履歴が最大20件に制限されている
- [ ] エラー通知が無限に蓄積されない仕組みがある

**検証方法**: Service 実装の制限ロジックを確認

---

## 9. デプロイレビュー

### CHK-901 [P1] - パッケージ依存関係

- [ ] `electron-store` が dependencies に追加されている
- [ ] `sonner` が dependencies に追加されている
- [ ] `eslint-plugin-react-hooks` が devDependencies に追加されている
- [ ] `package-lock.json` が更新されている

**検証方法**: `package.json` を確認

---

### CHK-902 [P2] - ビルド確認

- [ ] `npm run typecheck` がエラーなし
- [ ] `npm run lint` がエラーなし
- [ ] `npm run test` が全テストパス

**検証方法**: CI コマンドを実行

---

### CHK-903 [P2] - electron-store の ESM 互換性

- [ ] electron-store v11 が Vite 5 + Electron Forge でビルド可能
- [ ] 実行時に electron-store の import エラーが発生しない

**検証方法**: `npm start` でアプリ起動を確認（設計判断 § 9.2 の未解決課題）

---

## 完了基準

### PR 作成前チェックリスト

- [ ] すべての P1 項目がチェック済み
- [ ] `npm run typecheck` パス
- [ ] `npm run lint` パス
- [ ] `npm run test` 全テストパス

### マージ前チェックリスト

- [ ] すべての P1 項目がチェック済み
- [ ] すべての P2 項目がチェック済みまたは対応方針を決定
- [ ] コードレビュー承認済み

### リリース前チェックリスト

- [ ] すべての P1・P2 項目が完了
- [ ] P3 項目は対応方針を記録
- [ ] `npm start` でアプリが正常起動

---

## 参照ドキュメント

- PRD: [application-foundation.md](../../requirement/application-foundation.md)
- 抽象仕様書: [application-foundation_spec.md](../../specification/application-foundation_spec.md)
- 技術設計書: [application-foundation_design.md](../../specification/application-foundation_design.md)
- タスク分解: [tasks.md](./tasks.md)
