# プロジェクト原則

**バージョン**: 1.0.0
**最終更新日**: 2026-03-25
**ステータス**: 有効

## 目的

このドキュメントは、Buruma（Branch-United Real-time Understanding & Multi-worktree Analyzer）の開発を統制する非交渉原則と基準を定義します。すべてのコード、仕様、設計判断はこれらの原則に従う必要があります。

## 原則階層

```
1. ビジネス原則（最優先）
   ↓
2. アーキテクチャ原則
   ↓
3. 開発手法原則
   ↓
4. 技術制約
```

優先度が高い原則が低い原則に優先します。

---

## 1. ビジネス原則（最優先）

### B-001: Worktree-First UX

**原則**: ワークツリーを UI の主軸に据え、すべての操作フローはワークツリーの選択を起点とする

**適用範囲**: すべての UI 設計・画面遷移・機能設計

**検証方法**:

- [ ] UI の左パネルにワークツリー一覧が常時表示されているか
- [ ] すべての Git 操作が「どのワークツリーに対して行うか」が明確か
- [ ] ワークツリー間の切り替えが2クリック以内で可能か

**違反例**:

- ワークツリーの選択なしに Git 操作画面を表示する
- ブランチ一覧を主軸にした UI 設計
- ワークツリー情報が補助的な表示に留まる

**準拠例**:

- 左パネルのワークツリー一覧が常時表示され、選択で右パネルが切り替わる
- 新規ワークツリー作成がトップレベルのアクションとして提供される

---

### B-002: Git 操作の安全性

**原則**: 不可逆な Git 操作には必ず確認ステップを設け、ユーザーのデータを保護する

**適用範囲**: すべての Git 書き込み操作（コミット、プッシュ、ブランチ削除、リベース等）

**検証方法**:

- [ ] 不可逆操作（force push、ブランチ削除、ワークツリー削除等）に確認ダイアログがあるか
- [ ] 未コミット変更がある状態での破壊的操作に警告が表示されるか
- [ ] マージ・リベース中に常に中止（abort）オプションが提供されているか

**違反例**:

- 確認なしでリモートブランチを削除する
- 未コミット変更を警告なしで破棄する操作
- force push を通常のプッシュと同じ操作感で実行可能にする

**準拠例**:

- ワークツリー削除時に未コミット変更の有無を確認し、確認ダイアログを表示
- マージ中のコンフリクト解決画面で abort ボタンを常時表示

---

## 2. アーキテクチャ原則

### A-001: Electron プロセス分離

**原則**: メインプロセスとレンダラープロセスを厳密に分離し、preload + contextBridge 経由でのみ通信する

**適用範囲**: すべてのプロセス間通信、API 設計

**検証方法**:

- [ ] レンダラーから Node.js API に直接アクセスしていないか
- [ ] `nodeIntegration: false`, `contextIsolation: true` が維持されているか
- [ ] すべての IPC チャネルに TypeScript の型定義が存在するか
- [ ] Git 操作が必ずメインプロセスで実行されているか

**違反例**:

- レンダラープロセスから `require('child_process')` を直接呼び出す
- `nodeIntegration: true` に設定する
- 型定義なしの IPC チャネルを追加する

**準拠例**:

- preload.ts で contextBridge.exposeInMainWorld を使用して API を公開
- IPC チャネルごとに引数・戻り値の型定義を定義
- Git 操作を main.ts 側の ipcMain.handle で処理

---

### A-002: Library-First

**原則**: 可能な限り既存ライブラリを活用し、車輪の再発明を避ける

**適用範囲**: すべての実装

**検証方法**:

- [ ] 新規実装前に既存ライブラリを調査したか
- [ ] 自作する場合の明確な理由があるか

**違反例**:

- ライブラリ調査なしで自作実装
- Git コマンドのパーサーを独自実装（simple-git 等を使用すべき）

**準拠例**:

- Git 操作に simple-git を使用
- UI コンポーネントに Shadcn/ui を使用
- 差分表示に Monaco Editor を使用
- 自作する場合は理由を設計書に明記

---

### A-003: DI（依存性注入）ベース設計

**原則**: すべてのサービス・ロジックの依存関係は VContainer（`src/lib/di`）を通じて注入し、直接インスタンス化やグローバル参照を避ける

**適用範囲**: メインプロセス・レンダラープロセスのサービス層、ビジネスロジック

**検証方法**:

- [ ] サービスの依存関係が InjectionToken を使用してコンテナに登録されているか
- [ ] サービス間の依存がコンストラクタ注入（deps）またはファクトリー関数で解決されているか
- [ ] レンダラープロセスでは VContainerProvider 経由でコンテナが提供されているか
- [ ] ライフタイム（singleton / transient）が適切に設定されているか
- [ ] リソース解放が必要なサービスは DisposableStack で管理されているか

**違反例**:

- サービスクラス内で他のサービスを直接 `new` して使用する
- グローバル変数やモジュールスコープの変数でサービスインスタンスを共有する
- React コンポーネントから VContainerProvider を経由せずにサービスを取得する

**準拠例**:

- `createToken<T>()` で型安全なトークンを定義し、`container.register()` で登録
- `useVContainer()` フックでコンテナを取得し、`container.resolve()` でサービスを利用
- 親子コンテナ（`createScope()`）でスコープに応じた依存関係を管理
- setUp 関数で非同期初期化を行い、tearDown で DisposableStack を通じてクリーンアップ

---

### A-004: Clean Architecture（4層構成）

**原則**: feature 単位で domain / application / infrastructure / presentation の 4 層に分離し、依存方向は外側から内側への一方向のみとする

**適用範囲**: すべての feature 実装

**依存方向**:

```
domain ← application ← infrastructure
                     ← presentation
```

- **domain**: 何にも依存しない（純粋な TypeScript のみ）
- **application**: domain のみに依存（RxJS の Observable は許可）
- **infrastructure**: domain + application に依存
- **presentation**: domain + application に依存

**各層の責務**:

| 層 | 配置場所 | 責務 | 許可される依存 |
|:---|:---|:---|:---|
| **domain** | `features/*/domain/` | エンティティ、値オブジェクト、ドメインイベント | なし（純粋 TypeScript） |
| **application** | `features/*/application/` | UseCase（ステートレス）、Service（ステートフル）、リポジトリIF | domain, RxJS |
| **infrastructure** | `features/*/infrastructure/` | リポジトリ実装、IPC 通信、Git 操作、外部 API 連携 | domain, application, Node.js, Electron |
| **presentation** | `features/*/presentation/` | React コンポーネント、ViewModel | domain, application, React, RxJS |

**application 層の UseCase / Service 分離**:

- **UseCase（ステートレス）**: `src/lib/usecase/` の型を継承し、単一の操作・変換・ストリーム提供を担う。内部に状態を持たない
- **Service（ステートフル）**: BehaviorSubject 等で状態を保持・管理する。UseCase から利用される
- ViewModel は UseCase のみを参照し、Service を直接参照しない

```
ViewModel → UseCase（ステートレス） → Service（ステートフル）
                                   → リポジトリIF → infrastructure 実装
```

**feature 間依存ルール**:

- feature 間の直接参照は禁止する
- feature 間で共有が必要な型・ロジックは `src/lib/` に切り出す
- feature 間の連携は application 層のインターフェース + DI で行う

**IPC 通信の位置付け**:

- IPC 通信は外部境界として infrastructure 層に配置する
- レンダラー側: infrastructure 層が preload API を呼び出す
- メインプロセス側: infrastructure 層として IPC ハンドラーを実装する
- application 層はリポジトリインターフェースのみ参照し、IPC の詳細を知らない

**presentation 層の状態管理（MVVM パターン）**:

- ViewModel は純粋な TypeScript クラスとして実装する（React 非依存、Observable を公開）
- 各 ViewModel に対応する Hook ラッパー（`useXxxViewModel()`）を作成し、Observable → React state 変換を担う
- React コンポーネントは Hook ラッパー経由でのみ ViewModel を利用する
- `useResolve(token)` で DI コンテナから ViewModel を取得し、`useObservable(obs$, initial)` で Observable を購読する
- ViewModel 単体のテストは React 不要（Observable のテストのみ）

```
// ViewModel クラス（React 非依存）
class XxxViewModel {
  constructor(private someUseCase: SomeUseCase) {}
  readonly items$ = this.someUseCase.store
  doAction(arg: string) { this.someUseCase.invoke(arg) }
}

// Hook ラッパー（Observable → React state）
function useXxxViewModel() {
  const vm = useResolve(XxxViewModelToken)
  const items = useObservable(vm.items$, [])
  return { items, doAction: vm.doAction }
}

// React コンポーネント
function XxxPanel() {
  const { items, doAction } = useXxxViewModel()
  return <ul>{items.map(...)}</ul>
}
```

**検証方法**:

- [ ] domain 層が他の層に依存していないか（純粋な TypeScript のみ）
- [ ] application 層が infrastructure / presentation に依存していないか
- [ ] infrastructure 層が presentation に依存していないか
- [ ] リポジトリインターフェースが application 層に、実装が infrastructure 層に配置されているか
- [ ] feature ごとに `src/features/{feature-name}/` 配下にまとまっているか
- [ ] feature 間の直接参照が存在しないか
- [ ] IPC 通信が infrastructure 層に閉じているか
- [ ] ViewModel が presentation 層に配置され、React に直接依存していないか
- [ ] UseCase がステートレスであるか（内部に BehaviorSubject 等の状態を持っていないか）
- [ ] Service がステートフルな状態管理を担い、UseCase 経由でのみアクセスされているか
- [ ] ViewModel が Service を直接参照せず UseCase のみを参照しているか

**違反例**:

- domain 層で React, Electron, RxJS 等の外部ライブラリをインポートする
- application 層から infrastructure の具象クラスを直接参照する
- feature をまたいで domain 層を直接参照する（共有は `src/lib/` 経由）
- React コンポーネント内で直接 IPC を呼び出す
- ViewModel 内で `useState` や `useEffect` を使用する
- UseCase 内に BehaviorSubject 等の状態を保持する
- ViewModel が Service を直接参照する

**準拠例**:

- domain 層にエンティティ・値オブジェクト・ドメインイベントを配置
- application 層に UseCase（ステートレス、`src/lib/usecase/` 型を継承）と Service（ステートフル、状態管理）を配置
- UseCase が Service の状態を Observable として公開し、ViewModel が subscribe する
- infrastructure 層に IPC 通信、Git 操作、外部 API 連携の実装を配置し、リポジトリIF 経由で UseCase から利用
- presentation 層に ViewModel を配置し、UseCase のみを参照。React コンポーネントは hooks 経由で ViewModel を利用

---

### A-005: Pure TypeScript ビジネスロジック

**原則**: ビジネスロジック（domain 層・application 層）はフレームワーク非依存の純粋な TypeScript で実装する

**適用範囲**: `src/features/*/domain/`、`src/features/*/application/`

**検証方法**:

- [ ] domain 層に React, Electron, Node.js API のインポートが存在しないか
- [ ] application 層に React, Electron のインポートが存在しないか
- [ ] ビジネスロジックのテストがフレームワークのモック無しで実行可能か

**違反例**:

- domain 層で `import { ipcRenderer } from 'electron'` を使用
- application 層のユースケースで React hooks を使用
- ビジネスロジック内で `window` や `document` を参照

**準拠例**:

- domain 層のエンティティが plain class / interface のみで構成
- application 層のユースケースがリポジトリインターフェースのみに依存
- テストがブラウザ環境・Electron 環境を不要とする

---

### A-006: RxJS リアクティブストリーム

**原則**: 非同期データフローおよびイベント駆動ロジックには RxJS の Observable パターンを採用する

**適用範囲**: application 層のユースケース、infrastructure 層のデータソース、presentation 層の状態管理

**検証方法**:

- [ ] 非同期データフローが Observable ベースで実装されているか
- [ ] Subscription の解放が適切に管理されているか（DisposableStack / tearDown との連携）
- [ ] domain 層で RxJS に直接依存していないか（domain 層は純粋な TypeScript を維持）

**違反例**:

- domain 層のエンティティが Observable を返す
- Subscription を解放せずにメモリリークを発生させる
- コールバック地獄を RxJS で置き換え可能な箇所で放置する

**準拠例**:

- application 層のユースケースが `Observable<T>` を返し、presentation 層で subscribe する
- infrastructure 層で IPC イベントを Observable に変換する
- VContainerProvider の setUp/tearDown で Subscription をまとめて管理する

---

## 3. 開発手法原則

### D-001: Specification-Driven

**原則**: 仕様書なしで実装しない（AI-SDD ワークフローに従う）

**適用範囲**: すべての新機能・変更

**検証方法**:

- [ ] `*_spec.md` が存在する
- [ ] `*_design.md` が存在する
- [ ] 仕様書が最新（実装前に更新されている）
- [ ] PRD（`requirement/*.md`）から仕様書へのトレーサビリティが確保されている

**違反例**:

- 口頭指示のみで実装開始
- 仕様書が古いまま実装
- PRD の要求 ID を参照せずに機能を追加

**準拠例**:

- PRD → Spec → Design → Task → Implement のフローを遵守
- 仕様書を真実の源（Single Source of Truth）として管理

---

### D-002: Test-First

**原則**: テストを先に書いてから実装する（TDD）

**適用範囲**: すべてのコア機能（メインプロセスのサービス層、IPC ハンドラー）

**検証方法**:

- [ ] 実装前にテストケースが作成されている
- [ ] テストカバレッジ ≥ 80%（UI コンポーネントは ≥ 60%）
- [ ] 失敗するテストを先に書き、実装で通すフローを遵守

**違反例**:

- 実装完了後にテストを追加
- テストなしでのマージ

**準拠例**:

- Red → Green → Refactor のサイクルを遵守
- テストケース作成 → 実装 → リファクタリング

---

## 開発標準

### コード品質

| 標準 | 要件 | ツール | 適用方法 |
|:---|:---|:---|:---|
| **Linting** | エラー・警告ゼロ | ESLint 9 | Pre-commit hook |
| **型安全性** | 厳密な型チェック | TypeScript strict mode | CI/CD |
| **複雑度** | 循環的複雑度 ≤ 10 | ESLint ルール | Code review |

### ドキュメント

| 標準 | 要件 | 配置場所 | 更新頻度 |
|:---|:---|:---|:---|
| **PRD** | すべての機能グループに PRD が必要 | `.sdd/requirement/` | 要求変更時 |
| **仕様書** | すべての機能に `*_spec.md` が必要 | `.sdd/specification/` | 実装前 |
| **設計書** | すべての実装に `*_design.md` が必要 | `.sdd/specification/` | 設計フェーズ |
| **API文書** | すべての IPC チャネルをドキュメント化 | ソースファイル内 | コード変更時 |

### テスト

| 標準 | 要件 | 適用方法 | 例外 |
|:---|:---|:---|:---|
| **ユニットカバレッジ** | ≥ 80% 行カバレッジ | CI/CD gate | UI コンポーネント (≥ 60%) |
| **結合テスト** | すべてのメインフローをカバー | Manual review | - |
| **エッジケース** | 境界条件をテスト | Code review | - |

### セキュリティ

| 標準 | 要件 | 適用方法 | レビュー頻度 |
|:---|:---|:---|:---|
| **Electron セキュリティ** | Fuses 設定 + contextIsolation | Architecture review | 設計フェーズ |
| **入力検証** | すべてのユーザー入力を検証 | Security review | 各 PR |
| **シークレット管理** | コードにシークレットを含めない | Pre-commit hooks | 各コミット |
| **依存関係スキャン** | 重大な脆弱性ゼロ | npm audit | 定期実行 |

## アーキテクチャ制約

### Electron マルチプロセスアーキテクチャ

```
Renderer Process (React UI)
      ↓ contextBridge
Preload (API Bridge)
      ↓ ipcRenderer.invoke
Main Process (Node.js)
      ↓ child_process / simple-git
Git / Claude Code CLI
```

**ルール**:

- レンダラーから Node.js API に直接アクセスしない
- Git 操作は必ずメインプロセスで実行する
- Claude Code CLI は子プロセスとしてメインプロセスから起動する
- IPC チャネルには型安全なインターフェースを定義する

### 技術スタック制約

| レイヤー | 許可される技術 | 禁止事項 | 理由 |
|:---|:---|:---|:---|
| **フレームワーク** | Electron 41, Electron Forge 7 | NW.js, Tauri | Electron エコシステムの成熟度 |
| **バンドラー** | Vite 5 | Webpack, esbuild 直接 | Forge VitePlugin との統合 |
| **UI** | React 19, TypeScript | plain JS, Vue, Angular | 型安全性、エコシステム |
| **スタイリング** | Tailwind CSS v4 (`@tailwindcss/postcss`) | `@tailwindcss/vite`, CSS-in-JS | ESM 互換性問題の回避 |
| **コンポーネント** | Shadcn/ui (`rsc: false`) | Material UI, Ant Design | カスタマイズ性、バンドルサイズ |
| **リアクティブ** | RxJS | xstream, @most/core, 独自実装 | エコシステムの成熟度、TypeScript サポート |
| **Git 操作** | simple-git（予定） | nodegit, isomorphic-git | メンテナンス性、API の簡潔さ |
| **エディタ** | Monaco Editor（予定） | CodeMirror | VS Code との親和性 |
| **テスト** | Vitest, Testing Library | Jest, Enzyme | Vite ネイティブ対応 |

**例外プロセス**: 設計書（`*_design.md`）に理由を明記し、レビューで承認を得る

### モジュール構成

```
src/
├── main.ts              # Electron メインプロセスエントリ
├── preload.ts           # contextBridge API 定義
├── renderer.tsx         # React エントリポイント
├── App.tsx              # ルートコンポーネント（VContainerProvider でDIコンテナを提供）
├── features/            # 機能モジュール（Clean Architecture 4層）
│   └── {feature-name}/
│       ├── domain/          # エンティティ、値オブジェクト（純粋 TypeScript）
│       ├── application/     # ユースケース、リポジトリIF（純粋 TypeScript + RxJS）
│       ├── infrastructure/  # リポジトリ実装、IPC 通信、外部連携
│       └── presentation/    # React コンポーネント、ViewModel
├── components/          # 共有 React コンポーネント
│   └── ui/              # Shadcn/ui コンポーネント
├── lib/                 # 共有ユーティリティ
│   └── di/              # DIコンテナライブラリ（VContainer）
└── types/               # 共有型定義
```

**依存ルール**:

- `main.ts` は Node.js API、Git 操作、IPC ハンドラーを担当
- `preload.ts` は contextBridge で API を公開するのみ
- `features/` 配下は 4 層の依存方向を厳守: domain ← application ← infrastructure / presentation
- `domain/` 層はフレームワーク非依存（React, Electron, RxJS 等をインポートしない）
- `application/` 層はフレームワーク非依存（RxJS の Observable のみ許可）
- feature 間の共有が必要な型・ロジックは `lib/` または `types/` に配置する
- サービス間の依存は VContainer（`lib/di`）を通じて注入する。直接 `new` やグローバル参照による結合を避ける
- レンダラープロセスでは VContainerProvider を React ツリーのルート付近に配置し、useVContainer() でコンテナにアクセスする

## 意思決定フレームワーク

技術的トレードオフに直面した場合、以下の順序で優先順位付けします：

1. **安全性** - Git 操作でユーザーのデータを失わないか？
2. **正確性** - 仕様を満たしているか？
3. **セキュリティ** - Electron セキュリティベストプラクティスに準拠しているか？
4. **シンプルさ** - 最もシンプルな解決策か？
5. **パフォーマンス** - 大規模リポジトリでも十分に高速か？
6. **保守性** - 保守可能か？

**タイブレーカー**: 後で変更しやすい方を選択

## 品質ゲート

### Pre-Commit

- [ ] ESLint がエラーなしで通る
- [ ] TypeScript のコンパイルが通る
- [ ] シークレットが検出されない

### Pre-PR

- [ ] すべてのテストが通る
- [ ] カバレッジ ≥ 80%
- [ ] 仕様整合性を確認（`/check-spec`）
- [ ] 設計書を更新

### Pre-Merge

- [ ] コードレビュー承認
- [ ] CI/CD パイプラインが成功
- [ ] マージコンフリクトなし
- [ ] ドキュメント更新

## 4. 技術制約

### T-001: TypeScript Strict Mode

**原則**: すべてのソースコードで TypeScript strict モードを有効にし、any 型の使用を禁止する

**適用範囲**: すべてのソースコード（main / preload / renderer）

**検証方法**:

- [ ] `tsconfig.json` で `strict: true` が設定されているか
- [ ] `any` 型が使用されていないか（ESLint `@typescript-eslint/no-explicit-any`）
- [ ] すべての関数に明確な型定義があるか

**違反例**:

- `any` 型を使用した変数宣言
- 型アサーション（`as any`）の多用
- `@ts-ignore` コメントの使用

**準拠例**:

- すべての変数・引数・戻り値に明確な型定義
- ジェネリクスを活用した型安全な API
- unknown 型 + 型ガードによる安全な型絞り込み

---

### T-002: No Runtime Errors

**原則**: 実行時エラーを許容しない（コンパイル時に検出）

**適用範囲**: すべてのコード

**検証方法**:

- [ ] strict モード有効
- [ ] 型ガードの適切な使用
- [ ] Error Boundary の実装（React コンポーネント）
- [ ] IPC 通信のエラーハンドリングが網羅的

**違反例**:

- any 型の多用
- try-catch のない非同期処理
- 未処理の Promise rejection

**準拠例**:

- すべての関数に明確な型定義
- エラーケースの網羅的なハンドリング
- IPC 通信の Result 型パターン活用

---

### T-003: Electron セキュリティ制約

**原則**: Electron のセキュリティベストプラクティスに準拠し、攻撃面を最小化する

**適用範囲**: Electron の設定、プロセス間通信

**検証方法**:

- [ ] `nodeIntegration: false` が設定されているか
- [ ] `contextIsolation: true` が設定されているか
- [ ] FusesPlugin で `RunAsNode: false` 等が設定されているか
- [ ] remote モジュールが無効化されているか
- [ ] CSP（Content Security Policy）が適切に設定されているか

**違反例**:

- `nodeIntegration: true` に変更する
- `contextIsolation: false` に変更する
- レンダラーから `require()` を直接使用する

**準拠例**:

- forge.config.ts の FusesPlugin でセキュリティオプションを適用
- preload.ts で必要最小限の API のみを公開
- IPC チャネルの入力を検証してからメインプロセスで処理

---

## 原則追加のガイドライン

新しい原則を追加する際は、以下を考慮してください：

### 良い原則の条件

| 条件 | 説明 |
|:---|:---|
| **検証可能** | チェックリストで検証できること |
| **明確** | 曖昧さがなく、準拠/違反の判断が明確であること |
| **正当化可能** | なぜその原則が必要かが説明できること |
| **実現可能** | チーム全体が実践できること |
| **永続的** | 一時的な方針ではなく、長期的に守るべき原則であること |

### 追加プロセス

```
1. 提案（Issue等で議論）
   ↓
2. 承認
   ↓
3. 原則ファイルに追加
   ↓
4. バージョンをマイナーアップ（例: 1.0.0 → 1.1.0）
   ↓
5. 影響を受けるドキュメントを更新
   ↓
6. /constitution validate で検証
```

## コンプライアンス

### 適用メカニズム

**自動化**:

- Pre-commit フック（ESLint、TypeScript コンパイル）
- CI/CD パイプライン（テスト、カバレッジ）
- npm audit（依存関係の脆弱性）

**手動**:

- コードレビュー（アーキテクチャ、設計判断）
- `/constitution validate` による仕様・設計の準拠検証

### 違反への対処

| 重大度 | 対応 | 例 |
|:---|:---|:---|
| **重大** | 即座にマージをブロック | テストなし、セキュリティ設定の変更 |
| **主要** | 明示的な正当化が必要 | 設計書なしの新機能追加 |
| **軽微** | 現在の PR またはフォローアップで修正 | 軽微なドキュメント更新 |

### 例外プロセス

原則の遵守が不可能な場合：

1. **文書化**: 設計書（`*_design.md`）の「設計判断」セクションに記録
2. **正当化**: なぜ原則に従えないか説明
3. **緩和**: 補償統制を説明
4. **レビュー**: レビューで承認を得る

## 変更履歴

### v1.0.0 (2026-03-25)

**初版原則の確立**

- B-001: Worktree-First UX を定義
- B-002: Git 操作の安全性を定義
- A-001: Electron プロセス分離を定義
- A-002: Library-First を定義
- A-003: DI（依存性注入）ベース設計を定義
- A-004: Clean Architecture（4層構成）を定義
- A-005: Pure TypeScript ビジネスロジックを定義
- A-006: RxJS リアクティブストリームを定義
- D-001: Specification-Driven を定義
- D-002: Test-First を定義
- T-001: TypeScript Strict Mode を定義
- T-002: No Runtime Errors を定義
- T-003: Electron セキュリティ制約を定義

---

## 関連ドキュメント

### この原則を参照すべきドキュメント

| ドキュメント | 参照方法 |
|:---|:---|
| `.sdd/SPECIFICATION_TEMPLATE.md` | 原則への言及セクションを含める |
| `.sdd/DESIGN_DOC_TEMPLATE.md` | 原則準拠のチェックリストを含める |
| `*_spec.md` | 原則に基づいた設計を記述 |
| `*_design.md` | 設計判断が原則に準拠していることを明記 |

### 原則準拠の検証

```bash
/constitution validate
```

このコマンドで、すべての仕様書・設計書が原則に従っているかを自動検証できます。

---

## セマンティックバージョニング

原則のバージョンは以下のルールに従います：

| バージョン種別 | 用途 | 例 |
|:---|:---|:---|
| Major | 既存原則の削除・大幅変更（破壊的変更） | 1.0.0 → 2.0.0 |
| Minor | 新しい原則の追加 | 1.0.0 → 1.1.0 |
| Patch | 原則の表現修正、誤字修正 | 1.0.0 → 1.0.1 |

---

*この原則は生きたドキュメントです。プロジェクトのニーズに応じて進化すべきものです。*
