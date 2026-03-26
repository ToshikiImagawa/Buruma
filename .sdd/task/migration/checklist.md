# 品質チェックリスト: プロセス別ディレクトリ分離

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | アプリケーション基盤 プロセス別ディレクトリ分離 |
| チケット番号 | migration |
| 対象仕様書 | `.sdd/specification/application-foundation_spec.md` |
| 対象設計書 | `.sdd/specification/application-foundation_design.md` (v3.0) |
| 生成日 | 2026-03-27 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| ディレクトリ構造 | 8 | 6 | 2 | 0 |
| Clean Architecture | 8 | 6 | 2 | 0 |
| DI / Composition Root | 6 | 4 | 2 | 0 |
| ビルド・設定 | 5 | 4 | 1 | 0 |
| テスト | 5 | 3 | 2 | 0 |
| 機能回帰 | 6 | 6 | 0 | 0 |
| ドキュメント | 4 | 2 | 2 | 0 |
| **合計** | **42** | **31** | **11** | **0** |

**優先度レベル**:

- **P1**: 高 --- マージ前に完了すべき
- **P2**: 中 --- リリース前に完了すべき
- **P3**: 低 --- あると望ましい

---

## 1. ディレクトリ構造

### CHK-101 [P1] - プロセス別ディレクトリ分離

- [ ] `src/main/` ディレクトリが存在する
- [ ] `src/renderer/` ディレクトリが存在する
- [ ] `src/shared/` ディレクトリが存在する
- [ ] `src/preload/` ディレクトリが存在する

**検証方法**: `ls -d src/main src/renderer src/shared src/preload`

---

### CHK-102 [P1] - shared/ の構成

- [ ] `src/shared/domain/` に domain 型（RepositoryInfo, AppSettings 等）が配置されている
- [ ] `src/shared/types/` に IPC 型定義が配置されている
- [ ] `src/shared/lib/di/` に VContainer が配置されている
- [ ] `src/shared/lib/usecase/` に UseCase 共通型が配置されている
- [ ] `src/shared/lib/service/` に Service 共通型が配置されている

**検証方法**: ディレクトリ構造を確認

---

### CHK-103 [P1] - 旧ディレクトリの除去

- [ ] `src/features/` が存在しない
- [ ] `src/lib/` が存在しない
- [ ] `src/types/` が存在しない
- [ ] `src/di/` が存在しない
- [ ] `src/components/` が存在しない
- [ ] `src/main.ts`, `src/preload.ts`, `src/renderer.tsx`, `src/App.tsx` が存在しない

**検証方法**: `ls src/features src/lib src/types src/di src/components 2>&1` でエラーが出ること

---

### CHK-104 [P2] - パスエイリアス

- [ ] `@shared/*` エイリアスが全プロセスの Vite 設定で有効
- [ ] `@main/*` エイリアスが `vite.main.config.ts` で有効
- [ ] `@renderer/*` エイリアスが `vite.renderer.config.ts` で有効
- [ ] `@preload/*` エイリアスが `vite.preload.config.ts` で有効
- [ ] 旧エイリアス `@/*` が `tsconfig.json` から除去されている

**検証方法**: `tsconfig.json` と各 Vite 設定を確認

---

### CHK-105 [P2] - プロセス間依存の分離

- [ ] `src/renderer/` が `src/main/` を import していない
- [ ] `src/main/` が `src/renderer/` を import していない
- [ ] `src/preload/` が `src/main/` と `src/renderer/` を import していない

**検証方法**: `grep -r "from '@main/" src/renderer/` 等でヒットしないこと

---

## 2. Clean Architecture

### CHK-201 [P1] - メインプロセス4層構成

- [ ] `src/main/features/application-foundation/application/` に UseCase が存在する
- [ ] `src/main/features/application-foundation/infrastructure/` にデータアクセスが存在する
- [ ] `src/main/features/application-foundation/presentation/` に IPC Handler が存在する

**検証方法**: ディレクトリ構造を確認

---

### CHK-202 [P1] - メインプロセス依存方向

- [ ] application 層が infrastructure/presentation に依存していない
- [ ] infrastructure 層が presentation に依存していない
- [ ] presentation 層（IPC Handler）が application 層の UseCase に委譲している
- [ ] application 層がリポジトリ IF を定義し、infrastructure 層が実装している

**検証方法**: import 文を確認

---

### CHK-203 [P1] - ビジネスロジックの分離

- [ ] Git 検証ロジック（`isGitRepository`）が application 層 UseCase に存在する
- [ ] 履歴管理ロジック（`addToRecent`, MAX_RECENT）が application 層に存在する
- [ ] electron-store の直接操作が infrastructure 層に閉じている
- [ ] `execFile` の呼び出しが infrastructure 層に閉じている
- [ ] `dialog.showOpenDialog` の呼び出しが infrastructure 層に閉じている

**検証方法**: コードレビュー、`grep` で確認

---

### CHK-204 [P1] - IPC の層の正確性

- [ ] レンダラー側: IPC クライアント（`window.electronAPI.*`）が infrastructure 層に配置されている
- [ ] メインプロセス側: IPC Handler（`ipcMain.handle`）が presentation 層に配置されている

**検証方法**: ファイル配置を確認

---

### CHK-205 [P1] - レンダラー側構造の維持

- [ ] `src/renderer/features/application-foundation/application/` が存在する
- [ ] `src/renderer/features/application-foundation/infrastructure/` が存在する
- [ ] `src/renderer/features/application-foundation/presentation/` が存在する
- [ ] domain 型は `src/shared/domain/` から import している

**検証方法**: ディレクトリ構造と import を確認

---

### CHK-206 [P2] - domain 層のフレームワーク非依存

- [ ] `src/shared/domain/` に React, Electron, Node.js API の import がない

**検証方法**: `grep -r "from 'electron'" src/shared/domain/`

---

### CHK-207 [P1] - application 層のフレームワーク非依存

- [ ] `src/main/features/*/application/` に Electron, Node.js API の import がない
- [ ] `src/renderer/features/*/application/` に React, Electron の import がない

**検証方法**: import 文を確認

---

### CHK-208 [P2] - Service のライフサイクル統一

- [ ] Service IF が `BaseService` / `ParameterizedService<T>` を extends している
- [ ] Service に `setUp()` / `tearDown()` メソッドが実装されている
- [ ] di-config の setUp/tearDown で Service のインターフェース経由で呼び出している（キャスト不要）

**検証方法**: `di-tokens.ts` と `di-config.ts` を確認

---

## 3. DI / Composition Root

### CHK-301 [P1] - レンダラー側 DI

- [ ] `src/renderer/features/application-foundation/di-config.ts` が VContainerConfig を実装している
- [ ] `src/renderer/di/configs.ts` が全 feature の config を集約している
- [ ] `App.tsx` が `VContainerProvider` に `configs` を渡している

**検証方法**: ファイル内容を確認

---

### CHK-302 [P1] - メインプロセス側 DI

- [ ] `src/main/features/application-foundation/di-config.ts` が VContainerConfig を実装している
- [ ] `src/main/di/configs.ts` が全 feature の config を集約している
- [ ] `src/main/index.ts` が VContainer の container API で初期化している

**検証方法**: ファイル内容を確認

---

### CHK-303 [P1] - Composition Root の分離

- [ ] `src/main/index.ts` が infrastructure 層の具象クラスを直接 import していない
- [ ] `src/renderer/App.tsx` が infrastructure 層の具象クラスを直接 import していない
- [ ] 具象クラスへの依存が di-config.ts に閉じ込められている

**検証方法**: import 文を確認

---

### CHK-304 [P1] - DI トークン経由のアクセス

- [ ] メインプロセスの UseCase が infrastructure の IF を DI トークン経由で取得している
- [ ] presentation 層（IPC Handler）が UseCase を DI トークン経由で取得している

**検証方法**: コードレビュー

---

### CHK-305 [P2] - MainProcessConfig の廃止

- [ ] `MainProcessConfig` インターフェースが使用されていない
- [ ] `bootstrapMainProcess` 関数が使用されていない
- [ ] `src/main/lib/main-process/` が削除されている（または `src/shared/lib/main-process/` に残っていない）

**検証方法**: `grep -r "MainProcessConfig" src/`

---

### CHK-306 [P2] - tearDown の一貫性

- [ ] メインプロセスの VContainerConfig の setUp が tearDown 関数を返している
- [ ] app の 'before-quit' で tearDown が呼ばれている

**検証方法**: `src/main/index.ts` を確認

---

## 4. ビルド・設定

### CHK-401 [P1] - Vite ビルド設定

- [ ] `vite.main.config.ts` のエントリーが `src/main/index.ts` を指している
- [ ] `vite.renderer.config.ts` のエントリーが `src/renderer/renderer.tsx` を指している
- [ ] `vite.preload.config.ts` のエントリーが `src/preload/index.ts` を指している

**検証方法**: Vite 設定ファイルを確認

---

### CHK-402 [P1] - Forge 設定

- [ ] `forge.config.ts` の VitePlugin エントリーパスが新構造に更新されている

**検証方法**: `forge.config.ts` を確認

---

### CHK-403 [P1] - アプリ起動

- [ ] `npm start` でアプリが正常起動する
- [ ] DevTools コンソールにエラーがない
- [ ] IPC 通信が正常に動作する（設定取得、リポジトリ一覧取得）

**検証方法**: `npm start` で手動確認

---

### CHK-404 [P1] - CI 検証

- [ ] `npm run typecheck` が通る
- [ ] `npm run lint` が通る
- [ ] `npm run format:check` が通る

**検証方法**: CI コマンドを実行

---

### CHK-405 [P2] - パッケージング

- [ ] `npm run package` が成功する

**検証方法**: `npm run package` を実行

---

## 5. テスト

### CHK-501 [P1] - 既存テストの通過

- [ ] 移行前の 186 テストが全てパスする

**検証方法**: `npm run test`

---

### CHK-502 [P1] - メインプロセス UseCase テスト

- [ ] RepositoryMainUseCase のユニットテストが存在する
- [ ] SettingsMainUseCase のユニットテストが存在する
- [ ] Git 検証ロジックのテストが存在する
- [ ] 履歴管理ロジック（MAX_RECENT, 重複排除）のテストが存在する

**検証方法**: テストファイルの存在とテスト実行

---

### CHK-503 [P1] - メインプロセス DI テスト

- [ ] VContainer で全サービスが解決可能であることのテストが存在する

**検証方法**: テストファイルの存在とテスト実行

---

### CHK-504 [P2] - テストパス設定

- [ ] `vitest.config.ts` のパスエイリアスが新構造に更新されている

**検証方法**: `vitest.config.ts` を確認

---

### CHK-505 [P2] - カバレッジ

- [ ] メインプロセス application 層カバレッジ >= 80%

**検証方法**: `npm run test -- --coverage`

---

## 6. 機能回帰（リファクタリング前後で動作が変わらないこと）

### CHK-601 [P1] - リポジトリ管理

- [ ] フォルダ選択ダイアログでリポジトリを開ける（FR-001）
- [ ] Git リポジトリ検証が動作する（FR-002）
- [ ] 最近開いたリポジトリ履歴が保持される（FR-004）
- [ ] 履歴からのクイックオープンが動作する（FR-005）
- [ ] ピン留めが動作する（FR-006）

**検証方法**: `npm start` で手動確認

---

### CHK-602 [P1] - 設定管理

- [ ] テーマ切り替え（light/dark/system）が動作する（FR-007）
- [ ] 設定の永続化と起動時リストアが動作する（FR-010）

**検証方法**: `npm start` で手動確認

---

### CHK-603 [P1] - IPC 通信

- [ ] 全 IPC チャネルが正常に動作する（FR-011, FR-012）
- [ ] エラー通知がトースト表示される（FR-014）

**検証方法**: `npm start` で手動確認

---

### CHK-604 [P1] - 起動性能

- [ ] アプリ起動から UI 表示まで 3 秒以内（NFR-001）

**検証方法**: 手動計測

---

### CHK-605 [P1] - セキュリティ

- [ ] `nodeIntegration: false`, `contextIsolation: true` が維持されている
- [ ] レンダラーから Node.js API に直接アクセスしていない

**検証方法**: `forge.config.ts` と import 文を確認

---

### CHK-606 [P1] - UI 表示

- [ ] リポジトリ選択ダイアログが表示される
- [ ] 設定ダイアログが開閉できる
- [ ] エラー通知トーストが表示される

**検証方法**: `npm start` で手動確認

---

## 7. ドキュメント

### CHK-701 [P1] - design.md の最終更新

- [ ] §4.2 モジュール分割の移行注記が削除されている
- [ ] §4.1 システム構成図がメインプロセス4層を反映している
- [ ] 配置場所パスが実際のディレクトリ構造と一致している

**検証方法**: ドキュメントを確認

---

### CHK-702 [P1] - CONSTITUTION.md の最終更新

- [ ] モジュール構成の「移行状態」注記が削除されている
- [ ] ディレクトリ構造が実際の構造と一致している

**検証方法**: ドキュメントを確認

---

### CHK-703 [P2] - CLAUDE.md の最終更新

- [ ] Architecture セクションが実際の構造と一致している
- [ ] パスエイリアスが実際の設定と一致している

**検証方法**: ドキュメントを確認

---

### CHK-704 [P2] - SDD ドキュメント間の一貫性

- [ ] CONSTITUTION.md, CLAUDE.md, design.md, spec.md のディレクトリパスが一致している
- [ ] IPC の層の位置づけが全ドキュメントで一致している（レンダラー=infrastructure, メイン=presentation）

**検証方法**: ドキュメント間の比較

---

## 完了基準

### PR 作成前チェックリスト

- [ ] すべての P1 項目がチェック済み
- [ ] `npm run typecheck` パス
- [ ] `npm run lint` パス
- [ ] `npm run test` 全テストパス
- [ ] `npm start` でアプリが正常起動

### マージ前チェックリスト

- [ ] すべての P1 項目がチェック済み
- [ ] すべての P2 項目がチェック済みまたは対応方針を決定
- [ ] コードレビュー承認済み

---

## 参照ドキュメント

- PRD: [application-foundation.md](../../requirement/application-foundation.md)
- 抽象仕様書: [application-foundation_spec.md](../../specification/application-foundation_spec.md)
- 技術設計書: [application-foundation_design.md](../../specification/application-foundation_design.md) (v3.0)
- タスク分解: [tasks.md](./tasks.md)
- プロジェクト原則: [CONSTITUTION.md](../../CONSTITUTION.md)
