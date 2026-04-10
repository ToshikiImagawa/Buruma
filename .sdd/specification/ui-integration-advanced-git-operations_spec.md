---
id: "spec-ui-integration-advanced-git-operations"
title: "高度な Git 操作 UI 統合"
type: "spec"
status: "approved"
sdd-phase: "specify"
created: "2026-04-04"
updated: "2026-04-09"
depends-on: [ "prd-ui-integration-advanced-git-operations" ]
tags: [ "ui", "integration", "git", "merge", "rebase", "stash", "cherry-pick", "conflict", "tag", "tauri-migration" ]
category: "ui-integration"
priority: "high"
risk: "low"
---

# 高度な Git 操作 UI 統合

**関連 Design Doc:
** [ui-integration-advanced-git-operations_design.md](./ui-integration-advanced-git-operations_design.md)
**関連 PRD:** [ui-integration-advanced-git-operations.md](../requirement/ui-integration-advanced-git-operations.md)

---

# 1. 背景

Advanced Git Operations で実装済みの 7 UI コンポーネントは、バックエンド（IPC Handler, UseCase, Repository）と ViewModel +
Hook が完成しているが、既存の RepositoryDetailPanel に組み込まれていないため、ユーザーがアプリ画面から操作できない。本仕様はこれらのコンポーネントを既存
UI に統合する方法を定義する。

# 2. 概要

RepositoryDetailPanel の既存タブ構成（Info, Status, Commits, Branches, Files）に対して、以下の変更を加える:

1. **Branches タブ**: マージ・リベースボタンを追加
2. **Commits タブ**: チェリーピックボタンを追加
3. **新規 Refs タブ**: StashManager と TagManager を内部トグルで統合配置
4. **コンフリクト解決オーバーレイ**: コンフリクト発生時に全画面表示

# 3. 要求定義

## 3.1. 機能要件

| ID     | 要件                                                     | 優先度 | 根拠 (PRD)       |
|--------|--------------------------------------------------------|-----|----------------|
| FR-001 | Branches タブにマージボタンを追加し、MergeDialog を起動できる              | 必須  | FR_501         |
| FR-002 | Branches タブにリベースボタンを追加し、RebaseEditor を起動できる            | 推奨  | FR_502         |
| FR-003 | 新規 Refs タブを追加し、StashManager と TagManager を内部トグルで統合表示する | 必須  | FR_503, FR_506 |
| FR-004 | Commits タブにチェリーピックボタンを追加し、CherryPickDialog を起動できる      | 推奨  | FR_504         |
| FR-005 | コンフリクト発生時に ConflictResolver をオーバーレイ表示する                | 必須  | FR_505         |
| FR-007 | 操作完了後にステータス・ブランチ・コミットログをリフレッシュする                       | 必須  | FR_507         |
| FR-008 | Commits タブのブランチパネルを ResizablePanel の collapsible prop で折りたたみ可能にする | 推奨  | FR_508         |
| FR-009 | ブランチ右クリックでコンテキストメニュー表示（ローカル/リモート/HEAD で項目を分ける）          | 推奨  | FR_509         |
| FR-010 | ブランチ操作ヘッダーのボタンをアイコンのみ + Tooltip に変更                     | 任意  | FR_510         |
| FR-011 | コミット右クリックから指定コミットまでリセット（soft/mixed/hard サブメニュー）を実行できる | 推奨  | FR_511         |

# 4. API

## 4.1. 変更対象コンポーネント

| コンポーネント               | ファイル                                                                                                  | 変更内容                             |
|-----------------------|-------------------------------------------------------------------------------------------------------|----------------------------------|
| RepositoryDetailPanel | `src/features/repository-viewer/presentation/components/RepositoryDetailPanel.tsx` | Refs タブ（Stash/Tags 統合）追加、コンフリクトオーバーレイ状態管理 |
| BranchOperations      | `src/features/basic-git-operations/presentation/components/branch-operations.tsx`  | マージ・リベースボタン追加                    |

## 4.2. 状態管理

コンフリクト解決のオーバーレイ表示は RepositoryDetailPanel 内のローカル state で管理:

```typescript
const [conflictState, setConflictState] = useState<{
    active: boolean
    operationType: 'merge' | 'rebase' | 'cherry-pick'
} | null>(null)
```

# 5. 用語集

| 用語                    | 説明                           |
|-----------------------|------------------------------|
| RepositoryDetailPanel | メインコンテンツ領域。タブでリポジトリの各情報を表示する |
| オーバーレイ                | 通常のタブ表示を隠して全面表示するパネル         |

# 6. 制約事項

- 既存の 5 タブ（Info, Status, Commits, Branches, Files）の動作を変更しない
- 新コンポーネントの作成は最小限（統合ロジックのみ）
- advanced-git-operations のバックエンドロジックは変更しない

---

# PRD 整合性確認

| PRD 要求 ID | 本仕様での対応                       | ステータス |
|-----------|-------------------------------|-------|
| FR_501    | FR-001（Branches タブにマージボタン）    | 対応済み  |
| FR_502    | FR-002（Branches タブにリベースボタン）   | 対応済み  |
| FR_503    | FR-003（Refs タブに Stash 統合）     | 対応済み  |
| FR_504    | FR-004（Commits タブにチェリーピックボタン） | 対応済み  |
| FR_505    | FR-005（コンフリクト解決オーバーレイ）        | 対応済み  |
| FR_506    | FR-003（Refs タブに Tags 統合）      | 対応済み  |
| FR_507    | FR-007（操作後リフレッシュ）             | 対応済み  |
| FR_508    | FR-008（ブランチパネル折りたたみ）          | 対応済み  |
| FR_509    | FR-009（ブランチコンテキストメニュー）        | 対応済み  |
| FR_510    | FR-010（アイコンのみツールバー）           | 対応済み  |
| FR_511    | FR-011（コミットリセット）               | 対応済み  |
