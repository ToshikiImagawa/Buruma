---
id: "prd-ui-integration-advanced-git-operations"
title: "高度な Git 操作 UI 統合"
type: "prd"
status: "approved"
created: "2026-04-04"
updated: "2026-04-11"
depends-on: [ "prd-advanced-git-operations" ]
tags: [ "ui", "integration", "git", "merge", "rebase", "stash", "cherry-pick", "conflict", "tag", "tauri-migration" ]
category: "ui-integration"
priority: "high"
risk: "low"
---

# 高度な Git 操作 UI 統合 要求仕様書

## 概要

Advanced Git Operations で実装済みの 7 UI コンポーネント（MergeDialog, ConflictResolver, ThreeWayMergeView, StashManager,
RebaseEditor, CherryPickDialog, TagManager）を、既存の RepositoryDetailPanel に統合し、ユーザーがアプリの画面から操作できるようにする。

---

# 1. 要求図の読み方

## 1.1. 要求タイプ

- **requirement**: ユーザー要求
- **functionalRequirement**: 機能要求（UI 配置、導線、状態管理）
- **interfaceRequirement**: インターフェース要求（コンポーネント Props、タブ構成）

## 1.2. 優先度

- **Must**: アプリとして動作確認に必須
- **Should**: UX 改善
- **Could**: あると便利

---

# 2. 要求一覧

## 2.1. ユースケース図（概要）

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    Developer((開発者))

    subgraph Buruma["Buruma - UI 統合"]
        Merge["ブランチを<br/>マージする"]
        Rebase["リベースする"]
        Stash["変更を<br/>スタッシュする"]
        CherryPick["チェリーピック<br/>する"]
        ConflictResolve["コンフリクトを<br/>解決する"]
        TagMgmt["タグを<br/>管理する"]
    end

    Developer --- Merge
    Developer --- Rebase
    Developer --- Stash
    Developer --- CherryPick
    Developer --- ConflictResolve
    Developer --- TagMgmt
    Merge -.->|" <<発生>> "| ConflictResolve
    Rebase -.->|" <<発生>> "| ConflictResolve
```

## 2.2. 既存 UI 構成

RepositoryDetailPanel の現在のタブ構成:

| タブ             | 内容                                                    | 統合対象                             |
|----------------|-------------------------------------------------------|----------------------------------|
| Info           | ワークツリー情報                                              | -                                |
| Status         | StagingArea + CommitForm + PushPullButtons + DiffView | MergeDialog ボタン追加                |
| Commits        | CommitLog + CommitDetailView + DiffView               | CherryPickDialog ボタン追加           |
| Branches       | BranchOperations                                      | MergeDialog / RebaseEditor ボタン追加 |
| Files          | FileTree + DiffView                                   | -                                |
| **(新規) Stash** | -                                                     | **StashManager**                 |
| **(新規) Tags**  | -                                                     | **TagManager**                   |

## 2.3. 統合方針

| コンポーネント           | 統合方式                      | 配置先                                  |
|-------------------|---------------------------|--------------------------------------|
| MergeDialog       | ダイアログ（ボタンから起動）            | Branches タブ内にボタン追加                   |
| RebaseEditor      | ダイアログ（ボタンから起動）            | Branches タブ内にボタン追加                   |
| CherryPickDialog  | ダイアログ（ボタンから起動）            | Commits タブ内にボタン追加                    |
| ConflictResolver  | フルパネル表示（コンフリクト発生時に自動遷移）   | RepositoryDetailPanel 全体を置き換え        |
| StashManager      | 新規タブ                      | RepositoryDetailPanel に "Stash" タブ追加 |
| TagManager        | 新規タブ                      | RepositoryDetailPanel に "Tags" タブ追加  |
| ThreeWayMergeView | ConflictResolver 内に組み込み済み | -                                    |

---

# 3. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement UIIntegration {
        id: UR_701
        text: "高度な Git 操作を既存 UI から操作できる"
        risk: low
        verifymethod: demonstration
    }

    functionalRequirement MergeAccess {
        id: FR_701
        text: "Branches タブからマージダイアログを起動できる"
        risk: low
        verifymethod: test
    }

    functionalRequirement RebaseAccess {
        id: FR_702
        text: "Branches タブからリベースエディタを起動できる"
        risk: low
        verifymethod: test
    }

    functionalRequirement StashTab {
        id: FR_703
        text: "Stash タブでスタッシュ管理ができる"
        risk: low
        verifymethod: test
    }

    functionalRequirement CherryPickAccess {
        id: FR_704
        text: "Commits タブからチェリーピックダイアログを起動できる"
        risk: low
        verifymethod: test
    }

    functionalRequirement ConflictPanel {
        id: FR_705
        text: "コンフリクト発生時にコンフリクト解決パネルに自動遷移する"
        risk: medium
        verifymethod: test
    }

    functionalRequirement TagTab {
        id: FR_706
        text: "Tags タブでタグ管理ができる"
        risk: low
        verifymethod: test
    }

    functionalRequirement RefreshAfterOp {
        id: FR_707
        text: "操作完了後にステータス・ブランチ・コミットログがリフレッシュされる"
        risk: medium
        verifymethod: test
    }

    functionalRequirement CollapsibleBranchSidebar {
        id: FR_708
        text: "Commits タブのブランチパネルを折り畳み可能にする"
        risk: low
        verifymethod: test
    }

    functionalRequirement BranchContextMenu {
        id: FR_709
        text: "ブランチ右クリックでチェックアウト・マージ・リベース等のコンテキストメニューを表示する"
        risk: low
        verifymethod: test
    }

    functionalRequirement CompactIconToolbar {
        id: FR_710
        text: "ブランチ操作ボタンをアイコンのみ表示+ツールチップに変更し表示領域を節約する"
        risk: low
        verifymethod: demonstration
    }

    UIIntegration - contains -> MergeAccess
    UIIntegration - contains -> RebaseAccess
    UIIntegration - contains -> StashTab
    UIIntegration - contains -> CherryPickAccess
    UIIntegration - contains -> ConflictPanel
    UIIntegration - contains -> TagTab
    UIIntegration - contains -> RefreshAfterOp
    UIIntegration - contains -> CollapsibleBranchSidebar
    UIIntegration - contains -> BranchContextMenu
    functionalRequirement ResetToCommit {
        id: FR_711
        text: "コミット右クリックから指定コミットまでリセット（soft/mixed/hard）を実行できる"
        risk: medium
        verifymethod: test
    }

    functionalRequirement RebaseOntoSelector {
        id: FR_712
        text: "リベース実行時に onto 対象をブランチ/コミット一覧から選択形式で指定できる"
        risk: low
        verifymethod: test
    }

    UIIntegration - contains -> CompactIconToolbar
    UIIntegration - contains -> ResetToCommit
    UIIntegration - contains -> RebaseOntoSelector
```

---

# 4. 要求の詳細説明

## 4.1. 機能要求

### FR_701: マージダイアログアクセス

Branches タブの BranchOperations コンポーネント内に「マージ」ボタンを追加。クリックで MergeDialog
を開く。worktreePath、currentBranch、branches を ViewModel から取得して Props に渡す。マージ完了後に onConflict
でコンフリクト解決パネルに遷移する。

### FR_702: リベースエディタアクセス

Branches タブに「リベース」ボタンを追加。クリックで RebaseEditor をダイアログとして開く。コンフリクト発生時は
ConflictResolver に遷移。

### FR_703: Stash タブ

RepositoryDetailPanel に新規 "Stash" タブを追加。タブ内容として StashManager コンポーネントを配置。worktreePath を Props
で渡す。

### FR_704: チェリーピックダイアログアクセス

Commits タブに「チェリーピック」ボタンを追加。コミットログで選択中のコミットハッシュをデフォルト入力として CherryPickDialog
を開く。

### FR_705: コンフリクト解決パネル

マージ・リベース・チェリーピックでコンフリクトが発生した場合、RepositoryDetailPanel の通常タブ表示を非表示にし、ConflictResolver
をフルパネルで表示する。解決完了または中止で通常のタブ表示に戻る。

### FR_706: Tags タブ

RepositoryDetailPanel に新規 "Tags" タブを追加。タブ内容として TagManager コンポーネントを配置。

### FR_707: 操作完了後のリフレッシュ

マージ・リベース・チェリーピック・スタッシュ pop/apply の操作完了後に、repository-viewer の `git_status`、`git_branches`、
`git_log` を呼び出してステータスをリフレッシュする。

### FR_708: ブランチパネル折りたたみ

Commits タブのブランチパネル（BranchOperations）を折り畳み可能にする。ドラッグまたはトグルボタンで折りたたみ/展開を切り替えられること。折りたたみ時にコミット履歴の表示領域が拡大されること。

### FR_709: ブランチコンテキストメニュー

ブランチ一覧の各項目を右クリックした際にコンテキストメニューを表示する（B-002 準拠: 削除操作には確認ダイアログを表示）。メニュー項目はブランチの種別（ローカル HEAD /
ローカル非 HEAD / リモート）に応じて異なる:

- **ローカル（非 HEAD）**: チェックアウト、現在のブランチにマージ、このブランチへリベース、削除
- **ローカル（HEAD）**: マージ...、リベース...、新規ブランチ...
- **リモート**: リモートブランチを削除

なお、削除操作（ローカルブランチ削除・リモートブランチ削除）は不可逆であるため、実行前に確認ダイアログを表示する（CONSTITUTION.md
B-002 準拠）。

### FR_710: アイコンのみツールバー

ブランチ操作ヘッダーのボタン（マージ/リベース/新規作成）をアイコンのみの表示に変更し、ホバー時にツールチップで操作名を表示する。テキストラベルを削除することで表示領域を節約する。

### FR_711: コミットリセット

コミット一覧の各コミットを右クリックした際に「このコミットまでリセット」サブメニューを表示する（B-002 準拠: hard リセットは不可逆操作のため視覚的警告と確認ダイアログを表示）。リセットモードとして soft（変更をステージに保持）、mixed（変更をワーキングツリーに保持）、hard（変更を破棄）の3種類を選択できること。

hard リセットは不可逆操作であるため、メニュー項目を視覚的に警告表示する（CONSTITUTION.md B-002 準拠）。バックエンドとして git_reset IPC コマンドをフル実装する。

### FR_712: Rebase onto ブランチ/コミット選択UI

リベースエディタ（RebaseEditor）起動時に、onto 対象をテキスト入力ではなくブランチ/コミット一覧からの選択形式で指定できるようにする。ローカルブランチ・リモートブランチを一覧表示し、検索・フィルタリングで絞り込み可能とする。選択後にインタラクティブリベースのコミット一覧が表示される。

## 4.2. 非機能要求

### NFR_701: 不可逆操作の確認ダイアログ

不可逆操作（ブランチ削除・hard リセット）の実行前に確認ダイアログを必ず表示すること（CONSTITUTION.md B-002 準拠）。

| 属性 | 値 |
|:---|:---|
| 優先度 | must |
| リスク | high |
| カテゴリ | 安全性 |
| 検証方法 | demonstration |
| 派生元 | UR_701, CONSTITUTION.md B-002 |

### NFR_702: マージ・リベース中の中止オプション

マージ・リベース操作中は常に中止（abort）オプションを提供すること（CONSTITUTION.md B-002 準拠）。

| 属性 | 値 |
|:---|:---|
| 優先度 | must |
| リスク | high |
| カテゴリ | 安全性 |
| 検証方法 | demonstration |
| 派生元 | UR_701, CONSTITUTION.md B-002 |

---

# 5. スコープ外

- 新しいコンポーネントの作成（既存コンポーネントの統合のみ）
- advanced-git-operations のバックエンドロジックの変更
- RepositoryDetailPanel のレイアウト大規模リデザイン

---

# 6. 前提条件

- [advanced-git-operations.md](./advanced-git-operations.md) の機能が実装済みであること
- RepositoryDetailPanel が Tabs コンポーネントで構成されていること

---

# 要求サマリー

| カテゴリ        | 件数     |
|-------------|--------|
| ユーザー要求 (UR) | 1      |
| 機能要求 (FR)   | 12     |
| 非機能要求 (NFR) | 2      |
| **合計**      | **15** |

| 優先度         | 件数                                        |
|-------------|-------------------------------------------|
| 必須 (Must)   | 7（FR_701, FR_703, FR_705, FR_706, FR_707, NFR_701, NFR_702） |
| 推奨 (Should) | 6（FR_702, FR_704, FR_708, FR_709, FR_711, FR_712） |
| 任意 (Could)  | 1（FR_710）                                 |

> **採番規則:** 本PRDの要求IDは700番台を使用する。
