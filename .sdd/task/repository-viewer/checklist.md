# 品質チェックリスト: リポジトリ閲覧

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | リポジトリ閲覧 (repository-viewer) |
| 対象仕様書 | [repository-viewer_spec.md](../../specification/repository-viewer_spec.md) |
| 対象設計書 | [repository-viewer_design.md](../../specification/repository-viewer_design.md) |
| PRD | [repository-viewer.md](../../requirement/repository-viewer.md) |
| タスク分解 | [tasks.md](./tasks.md) |
| 生成日 | 2026-04-01 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P0 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|:---|
| 要求レビュー | 8 | 4 | 3 | 1 | 0 |
| 仕様レビュー | 7 | 4 | 2 | 1 | 0 |
| 設計レビュー | 6 | 3 | 2 | 1 | 0 |
| 実装レビュー | 8 | 3 | 3 | 2 | 0 |
| テストレビュー | 7 | 3 | 3 | 1 | 0 |
| ドキュメントレビュー | 3 | 0 | 2 | 1 | 0 |
| セキュリティレビュー | 4 | 3 | 1 | 0 | 0 |
| パフォーマンスレビュー | 5 | 2 | 2 | 1 | 0 |
| **合計** | **48** | **22** | **18** | **8** | **0** |

**優先度レベル**:

- **P0**: クリティカル — マージ前に必須
- **P1**: 高 — マージ前に完了すべき
- **P2**: 中 — リリース前に完了すべき
- **P3**: 低 — あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P0] FR_201 ステータス表示の実装

- [ ] ステージ済みファイルの一覧が表示される (FR_201_01)
- [ ] 未ステージファイルの一覧が表示される (FR_201_02)
- [ ] 未追跡ファイルの一覧が表示される (FR_201_03)
- [ ] 各ファイルに変更種別アイコン（追加/変更/削除/リネーム）が表示される (FR_201_04)
- [ ] ファイル選択で差分表示へ連携する (FR_201_05)

**検証方法**:
- `npm run test` でステータス関連のユニットテスト・コンポーネントテストが pass
- `npm start` で実際のリポジトリを開き手動確認

**対応タスク**: 2.1, 2.7, 3.5, 4.1

---

### CHK-102 [P0] FR_202 コミットログ表示の実装

- [ ] コミット一覧が表示される（ハッシュ短縮形、メッセージ、著者、日時） (FR_202_01)
- [ ] コミット選択で詳細表示が開く (FR_202_02)
- [ ] コミットメッセージ・ファイル名での検索・フィルタリングが動作する (FR_202_03)
- [ ] ページネーション（50件ずつ）でスクロール時に追加読み込みが動作する (FR_202_04)

**検証方法**:
- ユニットテストでページネーションロジック検証
- コンポーネントテストで仮想スクロール動作検証
- 手動テストで大規模リポジトリでの動作確認

**対応タスク**: 2.2, 2.3, 2.7, 3.6, 4.2, 4.3

---

### CHK-103 [P0] FR_203 差分表示の実装

- [ ] インライン差分表示モード（追加行/削除行ハイライト）が動作する (FR_203_01)
- [ ] サイドバイサイド差分表示モード（左右並列）が動作する (FR_203_02)
- [ ] シンタックスハイライト付きで差分が表示される (FR_203_03)
- [ ] 差分表示モードの切り替えが動作する (FR_203_04)
- [ ] ハンク単位での折りたたみ/展開が動作する (FR_203_05)

**検証方法**:
- Monaco Editor DiffEditor のインライン/サイドバイサイド切替テスト
- 複数言語（.ts, .tsx, .json, .md 等）でのシンタックスハイライト確認

**対応タスク**: 2.4, 2.7, 3.7, 4.4

---

### CHK-104 [P0] FR_204 ブランチ一覧表示の実装

- [ ] ローカルブランチの一覧が表示される (FR_204_01)
- [ ] リモートブランチの一覧が表示される (FR_204_02)
- [ ] 現在のブランチがハイライト表示される (FR_204_03)
- [ ] ブランチ名での検索・フィルタリングが動作する (FR_204_04)

**検証方法**:
- ユニットテストでブランチ分類ロジック検証
- コンポーネントテストでフィルタリング動作検証

**対応タスク**: 2.5, 2.7, 3.8, 4.5

---

### CHK-105 [P1] FR_205 ファイルツリー表示の実装

- [ ] ディレクトリ/ファイルのツリー構造が表示される (FR_205_01)
- [ ] ファイル選択で差分/内容表示へ連携する (FR_205_02)
- [ ] 変更ファイルに視覚的マーキングが表示される (FR_205_03)

**検証方法**:
- ユニットテストでツリー構築ロジック検証
- コンポーネントテストで展開/折りたたみ動作検証

**対応タスク**: 2.6, 2.7, 3.9, 4.6

---

### CHK-106 [P1] ユーザー要求のカバレッジ

- [ ] UR_201: ワークツリー選択時に詳細パネルで Git 情報が閲覧できる
- [ ] UR_202: ステータスから変更状態を一目で把握できる
- [ ] UR_203: コミット履歴を効率的に閲覧・検索できる
- [ ] UR_204: ファイルの変更内容を視覚的に確認できる

**検証方法**:
- `npm start` でワークツリー選択 → 各タブ/セクション表示の E2E フロー確認

---

### CHK-107 [P1] コンポーネント間連携

- [ ] StatusView のファイル選択 → DiffView に差分が表示される
- [ ] CommitLog のコミット選択 → CommitDetailView に詳細が表示される
- [ ] CommitDetailView のファイル選択 → DiffView にコミット差分が表示される
- [ ] FileTree のファイル選択 → DiffView に差分が表示される

**検証方法**:
- 手動テストで各ナビゲーションフローを確認

**対応タスク**: 5.3

---

### CHK-108 [P2] FR_202_05 ブランチグラフの簡易表示

- [ ] コミットログにブランチグラフの簡易表示がある（テキストベースで可）

**検証方法**:
- 手動テストでマージコミットがあるリポジトリで確認

---

## 2. 仕様レビュー

### CHK-201 [P0] IPC API シグネチャの一致

- [ ] `git:status` チャネルのシグネチャが仕様と一致（`{ worktreePath: string }` → `IPCResult<GitStatus>`）
- [ ] `git:log` チャネルのシグネチャが仕様と一致（`GitLogQuery` → `IPCResult<GitLogResult>`）
- [ ] `git:commit-detail` チャネルのシグネチャが仕様と一致
- [ ] `git:diff` / `git:diff-staged` / `git:diff-commit` チャネルのシグネチャが仕様と一致
- [ ] `git:branches` チャネルのシグネチャが仕様と一致
- [ ] `git:file-tree` チャネルのシグネチャが仕様と一致

**検証方法**:
```bash
npm run typecheck
```
- `IPCChannelMap` と `ElectronAPI` の型定義が仕様書 §4.1 と一致することを確認

**参照**: 仕様書 §4 API

---

### CHK-202 [P0] domain 型定義の整合性

- [ ] `GitStatus` 型が仕様の定義と一致（staged, unstaged, untracked フィールド）
- [ ] `FileChange` 型が仕様の定義と一致（path, type, oldPath）
- [ ] `CommitSummary` / `CommitDetail` 型が仕様の定義と一致
- [ ] `FileDiff` / `DiffHunk` / `DiffLine` 型が仕様の定義と一致
- [ ] `BranchList` / `BranchInfo` 型が仕様の定義と一致
- [ ] `FileTreeNode` 型が仕様の定義と一致
- [ ] `GitLogQuery` / `GitLogResult` / `GitDiffQuery` 型が仕様の定義と一致

**検証方法**:
- `src/shared/domain/` の型定義と仕様書 §4.3 を目視比較
- `npm run typecheck` で型エラーがないこと

**参照**: 仕様書 §4.3 型定義

---

### CHK-203 [P0] シーケンスフローの整合性

- [ ] ステータス取得フロー: レンダラー → Preload → メインプロセス → simple-git → 変換 → 返却（仕様書 §7.1）
- [ ] コミットログ取得フロー: ページネーションパラメータが正しく伝搬される（仕様書 §7.2）
- [ ] 差分表示フロー: ファイル選択 → diff 取得 → Monaco Editor 描画（仕様書 §7.3）
- [ ] ブランチ一覧取得フロー: git.branch → BranchList 変換（仕様書 §7.4）

**検証方法**:
- 結合テストで各フロー全体の動作検証

---

### CHK-204 [P0] コンポーネント Props の一致

- [ ] `StatusViewProps` が仕様と一致（worktreePath, onFileSelect）
- [ ] `CommitLogProps` が仕様と一致（worktreePath, onCommitSelect）
- [ ] `CommitDetailViewProps` が仕様と一致（worktreePath, commitHash, onFileSelect）
- [ ] `DiffViewProps` が仕様と一致（diffs, mode, onModeChange）
- [ ] `BranchListProps` が仕様と一致（worktreePath）
- [ ] `FileTreeProps` が仕様と一致（worktreePath, onFileSelect）

**検証方法**:
- `npm run typecheck` で型エラーがないこと

**参照**: 仕様書 §4.2 React コンポーネント API, §4.3 コンポーネント Props

---

### CHK-205 [P1] `IPCResult<T>` パターンの統一

- [ ] 全 IPC ハンドラーが `ipcSuccess()` / `ipcFailure()` を使用している
- [ ] エラーコードが設計書の命名規則（`GIT_*_ERROR`）に従っている
- [ ] エラーメッセージが日本語で統一されている

**検証方法**:
- IPC ハンドラーのコードレビュー

---

### CHK-206 [P1] 制約事項の遵守

- [ ] レンダラーから Node.js API に直接アクセスしていない（原則 A-001）
- [ ] Git 操作はメインプロセスでのみ実行されている（原則 A-001, A-002）
- [ ] IPC 通信は `IPCResult<T>` 型で統一されている（FR_604 準拠）
- [ ] ワークツリー管理機能の worktreePath を起点に全操作が実行される（原則 B-001）

**検証方法**:
- `npm run lint` で import 制約違反がないこと
- コードレビューで renderer → Node.js 直接アクセスがないことを確認

**参照**: 仕様書 §8 制約事項

---

### CHK-207 [P2] データ変換のエッジケース

- [ ] `mapStatusResult`: リネームファイル（from/to）が正しく変換される
- [ ] `parseDiffOutput`: バイナリファイルの差分が `isBinary: true` で返される
- [ ] `parseDiffOutput`: 空ファイルの差分が正しく処理される
- [ ] `buildFileTree`: 深いネスト（10階層以上）のディレクトリが正しくツリー化される

**検証方法**:
- ユニットテストでエッジケースを網羅

---

## 3. 設計レビュー

### CHK-301 [P0] Clean Architecture 4層構成の準拠

- [ ] メインプロセス側: `src/main/features/repository-viewer/` に application / infrastructure / presentation 層が存在する
- [ ] レンダラー側: `src/renderer/features/repository-viewer/` に application / infrastructure / presentation 層が存在する
- [ ] 依存方向: domain ← application ← infrastructure / presentation の一方向のみ
- [ ] application 層は RxJS の Observable 以外のフレームワーク依存がない

**検証方法**:
- ディレクトリ構造の目視確認
- import 文の方向確認（application → infrastructure への import がないこと）

---

### CHK-302 [P0] DI パターンの準拠

- [ ] `di-tokens.ts` に Token + UseCase 型エイリアスが定義されている
- [ ] `di-config.ts` で `useClass + deps` パターンで DI 登録されている
- [ ] `src/main/di/configs.ts` に `repositoryViewerMainConfig` が追加されている
- [ ] `src/renderer/di/configs.ts` に `repositoryViewerRendererConfig` が追加されている
- [ ] エントリーポイントが infrastructure 層の具象クラスを直接参照していない

**検証方法**:
```bash
npm run typecheck
```
- di-config.ts のコードレビュー

---

### CHK-303 [P0] 技術スタックの準拠

- [ ] Git 操作に `simple-git` が使用されている
- [ ] 差分表示に `Monaco Editor` の DiffEditor が使用されている
- [ ] 仮想スクロールに `@tanstack/react-virtual` が使用されている
- [ ] 未承認の外部依存関係が追加されていない

**検証方法**:
- `package.json` の dependencies を確認
- import 文のレビュー

**参照**: 設計書 §3 技術スタック

---

### CHK-304 [P1] ViewModel + Hook パターンの準拠

- [ ] ViewModel は純粋な TypeScript クラスとして実装されている（React 非依存）
- [ ] ViewModel は RxJS Observable でデータを公開している
- [ ] Hook ラッパーが `useResolve` + `useObservable` で ViewModel を React に接続している
- [ ] ViewModel は DI で transient 登録されている

**検証方法**:
- コードレビュー

---

### CHK-305 [P1] UseCase / Service / Repository の命名規則

- [ ] UseCase は 1クラス = 1操作で実装されている
- [ ] Service はステートフルなクラスのみに「Service」と命名されている
- [ ] Repository はステートレスな外部 API ラッパーに「Repository」と命名されている
- [ ] Service は `BaseService` を extends し、`setUp()` / `tearDown()` を実装している

**検証方法**:
- コードレビュー

---

### CHK-306 [P2] 設計書の未解決課題への対応

- [ ] Monaco Editor の Vite 5 + Electron での統合方法が検証・解決されている
- [ ] simple-git の同時実行制御について対応方針が決まっている（キュー管理 or 問題なしの判断）

**検証方法**:
- `npm start` で Monaco Editor が正常に描画されることを確認
- 同時操作のストレステスト（任意）

**参照**: 設計書 §9.2 未解決の課題

---

## 4. 実装レビュー

### CHK-401 [P0] コード構造とプロジェクト規約

- [ ] `npm run lint` がエラー 0 で pass
- [ ] `npm run typecheck` がエラー 0 で pass
- [ ] `npm run format:check` が差分なしで pass
- [ ] パスエイリアス（`@shared/*`, `@main/*`, `@renderer/*`）が正しく使用されている

**検証方法**:
```bash
npm run lint && npm run typecheck && npm run format:check
```

---

### CHK-402 [P0] IPC エラーハンドリング

- [ ] 全 IPC ハンドラーで try-catch が実装されている
- [ ] エラー時に `ipcFailure()` で `IPCResult` を返している（例外を投げない）
- [ ] エラーコードが一意で識別可能（`GIT_STATUS_ERROR`, `GIT_LOG_ERROR` 等）
- [ ] simple-git のエラーが適切に捕捉されている（Git CLI が見つからない場合等）

**検証方法**:
- ユニットテストで simple-git がエラーを投げるケースを検証

---

### CHK-403 [P0] Preload API の安全性

- [ ] `contextBridge.exposeInMainWorld` で git API が公開されている
- [ ] `ipcRenderer.invoke` のみ使用（`ipcRenderer.send` を直接公開していない）
- [ ] チャネル名がハードコードではなく型定義から参照されている（可能な場合）

**検証方法**:
- `src/preload/preload.ts` のコードレビュー

---

### CHK-404 [P1] diff パースロジック

- [ ] unified diff 形式（`@@` ヘッダー）を正しくパースしている
- [ ] 追加行（`+`）、削除行（`-`）、コンテキスト行（` `）を正しく分類している
- [ ] 行番号（oldLineNumber, newLineNumber）が正しく計算されている
- [ ] 複数ファイルの diff が正しく分割されている

**検証方法**:
- ユニットテストで様々な diff パターンを検証（単一ファイル、複数ファイル、バイナリ、リネーム）

---

### CHK-405 [P1] ファイルツリー構築ロジック

- [ ] `git ls-tree -r HEAD` の出力から正しくツリーが構築される
- [ ] ディレクトリノードが自動生成される（ls-tree はファイルのみ返すため）
- [ ] `git status` のマージにより変更ファイルに `changeType` が付与される

**検証方法**:
- ユニットテストでフラットなファイルリストからのツリー構築を検証

---

### CHK-406 [P1] Monaco Editor 統合

- [ ] DiffEditor の初期化・破棄がメモリリークなく行われている（useEffect cleanup）
- [ ] `automaticLayout: true` でウィンドウリサイズに追従する
- [ ] ファイル拡張子に応じた言語検出（`detectLanguage`）が動作する
- [ ] readOnly モードで表示専用になっている

**検証方法**:
- 手動テストでモード切替・リサイズを確認
- DevTools の Memory プロファイルでリークがないことを確認

---

### CHK-407 [P2] 仮想スクロール

- [ ] `@tanstack/react-virtual` で CommitLog の仮想スクロールが実装されている
- [ ] スクロール末尾到達時に自動でページネーション（次の50件取得）が発火する
- [ ] ローディング状態の表示がある

**検証方法**:
- 大量コミット（1000+）があるリポジトリで手動テスト

---

### CHK-408 [P2] Observable プロパティの実装ルール

- [ ] Observable プロパティは constructor でフィールドとして1回だけ生成されている（getter で都度生成しない）
- [ ] Service の tearDown で BehaviorSubject の `complete()` が呼ばれている

**検証方法**:
- コードレビュー

---

## 5. テストレビュー

### CHK-501 [P0] メインプロセス側ユニットテスト

- [ ] `GitReadRepository` の各メソッドのユニットテスト（simple-git モック）
- [ ] `mapStatusResult` 変換のユニットテスト（カバレッジ ≥ 90%）
- [ ] `parseDiffOutput` パースのユニットテスト（カバレッジ ≥ 90%）
- [ ] `mapCommitSummary` / `mapBranchResult` 変換のユニットテスト
- [ ] `buildFileTree` ツリー構築のユニットテスト

**検証方法**:
```bash
npm run test
```

**目標**: データ変換関数 ≥ 90%、GitReadRepository ≥ 80%

---

### CHK-502 [P0] レンダラー側ユニットテスト

- [ ] 各 ViewModel のロジックテスト（BehaviorSubject の状態遷移）
- [ ] UseCase のテスト（リポジトリ IF への委譲）
- [ ] Service のライフサイクルテスト（setUp / tearDown）

**検証方法**:
```bash
npm run test
```

---

### CHK-503 [P0] コンポーネントテスト

- [ ] StatusView: 3セクション（staged/unstaged/untracked）が正しく表示される
- [ ] CommitLog: コミット一覧が表示され、コミット選択イベントが発火する
- [ ] DiffView: Monaco Editor が描画される（モック可）
- [ ] BranchList: ローカル/リモートが分類表示される
- [ ] FileTree: ツリーの展開/折りたたみが動作する

**検証方法**:
```bash
npm run test
```

**目標**: コンポーネントテスト ≥ 60%

---

### CHK-504 [P1] IPC ハンドラーテスト

- [ ] 各 `git:*` チャネルの正常系テスト
- [ ] 各 `git:*` チャネルのエラー系テスト（`ipcFailure` が返ること）

**検証方法**:
```bash
npm run test
```

---

### CHK-505 [P1] エッジケーステスト

- [ ] 空のリポジトリ（コミットなし）でのステータス取得
- [ ] コミットが1つしかないリポジトリでの `getCommitDetail`（`hash~1` が存在しない）
- [ ] バイナリファイルの差分表示
- [ ] リネームファイルのステータス・差分表示
- [ ] 非常に長いファイルパスのツリー表示

**検証方法**:
- ユニットテストで各エッジケースを検証

---

### CHK-506 [P1] テスト全体の pass

- [ ] `npm run test` が全テスト pass（exit code 0）

**検証方法**:
```bash
npm run test
```

---

### CHK-507 [P2] モック戦略の妥当性

- [ ] simple-git のモックが現実的（実際の Git 出力に近いテストデータ）
- [ ] IPC 呼び出しのモックが `IPCResult<T>` パターンに従っている
- [ ] コンポーネントテストで window.electronAPI のモックが適切

**検証方法**:
- テストコードのレビュー

---

## 6. ドキュメントレビュー

### CHK-601 [P1] 設計書の更新

- [ ] `repository-viewer_design.md` の `impl-status` が `implemented` に更新されている
- [ ] 実装進捗テーブルの各モジュールステータスが実態を反映している
- [ ] 設計判断セクションに実装時の追加判断が記録されている（あれば）

**検証方法**:
- 設計書と実装の比較

---

### CHK-602 [P1] 変更履歴の維持

- [ ] 設計書の変更履歴セクションに実装時の変更が記録されている
- [ ] 設計書のフラット構造 → Clean Architecture 4層構成への差異が記録されている

**検証方法**:
- 設計書 §10 変更履歴を確認

---

### CHK-603 [P2] タスクファイルの更新

- [ ] `tasks.md` の全タスクが完了状態（実装完了時）

**検証方法**:
- `tasks.md` の確認

---

## 7. セキュリティレビュー

### CHK-701 [P0] Electron プロセス分離

- [ ] `nodeIntegration: false` が維持されている（既存設定）
- [ ] `contextIsolation: true` が維持されている（既存設定）
- [ ] レンダラーから `require()` や Node.js API が直接使用されていない
- [ ] `contextBridge.exposeInMainWorld` 経由でのみ API が公開されている

**検証方法**:
- `forge.config.ts` と `preload.ts` のコードレビュー
- レンダラーコードで `require`, `process`, `fs` 等の import がないことを Grep 確認

---

### CHK-702 [P0] IPC 入力値検証

- [ ] `worktreePath` が空文字列やパストラバーサル攻撃に対してバリデーションされている
- [ ] `hash` が正規のコミットハッシュ形式であることがチェックされている
- [ ] `filePath` にパストラバーサル（`../` 等）がないことがチェックされている

**検証方法**:
- IPC ハンドラーのバリデーションコードレビュー
- 不正入力でのユニットテスト

---

### CHK-703 [P0] コマンドインジェクション防止

- [ ] simple-git API 経由でのみ Git コマンドが実行されている（`child_process.exec` 直接使用なし）
- [ ] simple-git に渡すパラメータにユーザー入力がそのまま含まれていないか確認

**検証方法**:
- コードレビューで `exec`, `spawn`, `child_process` の使用がないことを確認

---

### CHK-704 [P1] エラー情報の漏洩防止

- [ ] 内部エラーの詳細（スタックトレース等）がレンダラーに露出していない
- [ ] `ipcFailure` の `detail` フィールドに機密情報が含まれていない

**検証方法**:
- エラーハンドリングのコードレビュー

---

## 8. パフォーマンスレビュー

### CHK-801 [P0] NFR_201 ステータス表示パフォーマンス

- [ ] 変更ファイル数1000以下でステータス表示が2秒以内に完了する

**検証方法**:
- パフォーマンステスト（計測タイマー付き）
- 手動テストで大量変更ファイルのリポジトリで確認

**参照**: PRD NFR_201

---

### CHK-802 [P0] NFR_202 コミットログ初期表示パフォーマンス

- [ ] コミットログの初期表示（最新50件）が1秒以内に完了する
- [ ] 10万コミット以上のリポジトリでもこの制約を満たす

**検証方法**:
- 大規模リポジトリ（Linux kernel 等）でのベンチマーク
- `--max-count=50` が確実に渡されていることをコードで確認

**参照**: PRD NFR_202

---

### CHK-803 [P1] NFR_203 差分表示パフォーマンス

- [ ] 単一ファイル（10000行以下）の差分表示が1秒以内に完了する

**検証方法**:
- 大きなファイルの diff でのパフォーマンステスト

**参照**: PRD NFR_203

---

### CHK-804 [P1] 仮想スクロールのパフォーマンス

- [ ] 1000件以上のコミットログ表示時に描画がスムーズ（FPS 落ちなし）
- [ ] DOM ノード数が一定数以内に抑えられている（仮想スクロールによる）

**検証方法**:
- DevTools Performance タブでのフレームレート確認

---

### CHK-805 [P2] Monaco Editor のメモリ使用

- [ ] DiffView コンポーネントのマウント/アンマウントでメモリリークがない
- [ ] ファイル切替時に前の DiffEditor が正しく dispose されている

**検証方法**:
- DevTools Memory タブでのヒープスナップショット比較

---

## 完了基準

### PR 作成前チェックリスト

すべての P0 項目が完了している必要があります:

- [ ] すべての P0 項目がチェック済み (22/22)
- [ ] `npm run test` が全テスト pass
- [ ] `npm run lint && npm run typecheck` がエラー 0
- [ ] 仕様との整合性が検証されている

### マージ前チェックリスト

すべての P0 と P1 項目が完了している必要があります:

- [ ] すべての P0 項目がチェック済み (22/22)
- [ ] すべての P1 項目がチェック済み (18/18)
- [ ] コードレビュー承認済み
- [ ] CI パイプライングリーン

### リリース前チェックリスト

P2 までのすべての項目が完了している必要があります:

- [ ] すべての P0 項目がチェック済み (22/22)
- [ ] すべての P1 項目がチェック済み (18/18)
- [ ] すべての P2 項目がチェック済み (8/8)

---

## 参照ドキュメント

- PRD: [repository-viewer.md](../../requirement/repository-viewer.md)
- 抽象仕様書: [repository-viewer_spec.md](../../specification/repository-viewer_spec.md)
- 技術設計書: [repository-viewer_design.md](../../specification/repository-viewer_design.md)
- タスク分解: [tasks.md](./tasks.md)
