---
id: "spec-{feature-name}"
title: "{機能名}"
type: "spec"
status: "draft"
sdd-phase: "specify"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
depends-on: []
tags: []
category: ""
priority: "medium"
risk: "medium"
---

# {機能名} `<MUST>`

**関連 Design Doc:** [{feature-name}_design.md](./specification/{feature-name}_design.md)
**関連 PRD:** [{feature-name}.md](./requirement/{feature-name}.md)

---

# 1. 背景 `<MUST>`

なぜこの機能が必要なのかを説明します。

# 2. 概要 `<MUST>`

機能の目的と主要な設計原則を説明します。
**技術的な実装詳細は含めず、「何を実現するか」に焦点を当てます。**

# 3. 要求定義 `<RECOMMENDED>`

## 3.1. 機能要件 (Functional Requirements)

| ID | 要件 | 優先度 | 根拠 |
|--------|------|------|------|
| FR-001 | [要件] | 必須 | [理由] |

## 3.2. 非機能要件 (Non-Functional Requirements) `<OPTIONAL>`

| ID | カテゴリ | 要件 | 目標値 |
|---------|------|------|------|
| NFR-001 | 性能 | [要件] | [目標] |

# 4. API `<MUST>`

## 4.1. IPC API（メインプロセス ↔ レンダラー）

preload + contextBridge 経由で公開する API を定義します。

| チャネル名 | 方向 | 概要 | 引数 | 戻り値 |
|-----------|------|------|------|--------|
| `{channel}` | renderer → main | [概要] | [引数の型] | [戻り値の型] |

## 4.2. React コンポーネント API

| コンポーネント | Props | 概要 |
|--------------|-------|------|
| `{Component}` | [Props型] | [概要] |

## 4.3. 型定義 `<OPTIONAL>`

```typescript
// IPC チャネルの型定義
interface {Feature}API {
  method(args: ArgType): Promise<ReturnType>;
}

// データモデル
interface {Model} {
  id: string;
  // ...
}
```

# 5. 用語集 `<OPTIONAL>`

| 用語 | 説明 |
|------|------|
| [用語] | [説明] |

# 6. 使用例 `<RECOMMENDED>`

```typescript
// レンダラー側での使用例
const result = await window.electronAPI.someMethod(args);

// React コンポーネントの使用例
<SomeComponent prop={value} />
```

# 7. 振る舞い図 `<OPTIONAL>`

Electron のプロセス間通信を含む振る舞いを記述します。

```mermaid
sequenceDiagram
    participant Renderer as レンダラー (React)
    participant Preload as Preload
    participant Main as メインプロセス
    participant Git as Git

    Renderer ->> Preload: contextBridge API 呼び出し
    Preload ->> Main: ipcRenderer.invoke(channel, args)
    Main ->> Git: Git 操作
    Git -->> Main: 結果
    Main -->> Preload: 結果
    Preload -->> Renderer: Promise 解決
```

# 8. 制約事項 `<OPTIONAL>`

- レンダラーから Node.js API に直接アクセスしない
- Git 操作は必ずメインプロセスで実行する
- IPC 通信は型安全なインターフェースを経由する

---

# セクション必須度の凡例

| マーク | 意味 | 説明 |
|------|------|------|
| `<MUST>` | 必須 | すべての仕様書で必ず記載してください |
| `<RECOMMENDED>` | 推奨 | 可能な限り記載することを推奨します |
| `<OPTIONAL>` | 任意 | 必要に応じて記載してください |

---

# ガイドライン

## 含めるべき内容

- 機能の目的と背景
- IPC API 定義（チャネル名、方向、型）
- React コンポーネントの公開インターフェース
- データモデルの論理構造
- プロセス間通信を含む振る舞い図
- 機能要件・非機能要件

## 含めないべき内容（→ Design Doc へ）

- 実装ステータス・進捗
- 技術スタックの選定理由
- モジュール構成・ファイル配置
- 実装パターン・デザインパターンの適用
- テスト戦略・カバレッジ目標
- 設計判断の記録

---

**この仕様書は、AIエージェントが仕様化（Specify）フェーズで参照する、システム構造と振る舞いの真実の源となります。**
