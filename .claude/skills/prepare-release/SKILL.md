---
name: prepare-release
description: "リリース準備を実行。CHANGELOG.md 更新、バージョン更新（package.json / Cargo.toml / tauri.conf.json）を行う。ユーザーが「リリース準備」「リリースする」「prepare release」「バージョン上げて」「CHANGELOG 更新」と言ったとき、または新バージョンのリリース準備が必要な場面で使用する。"
version: 1.0.0
user-invocable: true
argument-hint: "<version>"
allowed-tools: Read, Edit, Glob, Grep, Bash
---

# Prepare Release - リリース準備スキル

CHANGELOG.md を更新し、プロジェクト全体のバージョンを一括更新するリリース準備スキル。

**ハイブリッド方式**: `[Unreleased]` セクションに既存内容があればそれを活用し、git 変更履歴から不足分を補完する。

## Input

$ARGUMENTS

バージョン番号を引数として受け取る（`v` プレフィックスなし）。

### Input Examples

```
/prepare-release 0.2.0
/prepare-release 1.0.0-beta
```

### Validation

- 引数が空の場合はエラー終了し、使用例を表示する
- セマンティックバージョニング形式（`X.Y.Z` または `X.Y.Z-prerelease`）であることを確認する

## Target Files

### CHANGELOG File

| ファイル           | 言語  |
|:---------------|:----|
| `CHANGELOG.md` | 日本語 |

### Version Manifest Files

バージョンは以下の 3 ファイルに分散しており、すべて同一バージョンに更新する。

| ファイル                        | フィールド     |
|:----------------------------|:----------|
| `package.json`              | `"version"` |
| `src-tauri/Cargo.toml`      | `version`   |
| `src-tauri/tauri.conf.json` | `"version"` |

## Processing Flow

### Step 1: Validate Version Argument

1. `$ARGUMENTS` からバージョン番号をパースする
2. セマンティックバージョニング形式を検証する
3. 不正な場合はエラーメッセージと使用例を表示して終了する

### Step 2: Detect Previous Release

1. `git tag --list 'v*' --sort=-version:refname` で最新のリリースタグを取得する
2. タグが存在しない場合は初回リリースとして扱う（全コミットを対象にする）
3. 比較基点を記録する（例: `v0.1.0`）

### Step 3: Read Current [Unreleased] Content

CHANGELOG.md を Read で読み込み、`## [Unreleased]` セクションの内容を抽出する。

- **内容あり**: 既存エントリをベースとして保持する
- **内容なし**: Step 4 で全エントリを生成する

### Step 4: Analyze Git Changes

前回タグから HEAD までの変更を分析する。

```bash
# コミット一覧
git log <previous-tag>..HEAD --oneline --no-merges

# 変更ファイル統計
git diff <previous-tag>..HEAD --stat
```

変更内容を以下のカテゴリに分類する:

| Category         | 判定基準                           |
|:-----------------|:-------------------------------|
| Breaking Changes | 互換性を破る変更、設定ファイル形式変更            |
| Added            | 新機能、新 UI コンポーネント               |
| Changed          | 既存機能の改善・変更                     |
| Fixed            | バグ修正、不具合対応                     |
| Removed          | 機能や UI の削除                     |

### Step 5: Generate / Supplement CHANGELOG Entries

**重要: CHANGELOG はアプリケーション利用者向けである。**

以下の変更は CHANGELOG に **含めない**:

- CI/CD ワークフロー（`.github/workflows/`）の追加・変更
- 開発者向けスクリプトの追加・変更
- テストコード・テストフィクスチャ（`__tests__/`, `*.test.ts`）の追加・変更
- `.claude/` 配下の開発者向け設定・スキル
- `.sdd/` 配下の設計ドキュメント
- `.gitignore`、PR テンプレート等のリポジトリ管理ファイル
- 純粋な内部リファクタリング（ユーザーに見える変化がないもの）
- ドキュメント（README.md 等）の変更

以下の変更は CHANGELOG に **含める**:

- `src/` 配下のフロントエンドコード変更（UI、機能追加・変更）
- `src-tauri/src/` 配下のバックエンドコード変更（新コマンド、機能改善）
- ユーザーが体感するバグ修正・機能追加・パフォーマンス改善
- 対応プラットフォームの追加・変更

**ハイブリッドロジック:**

1. `[Unreleased]` に既存内容がある場合:
    - 既存エントリをベースとする
    - git 変更履歴と照合し、カバーされていないユーザー向け変更を特定する
    - 不足分のエントリのみ追加生成する
2. `[Unreleased]` が空の場合:
    - git 変更履歴からユーザー向け変更のエントリを生成する
3. ユーザー向け変更が存在しない場合:
    - ユーザーに「利用者向けの変更がありません」と報告し、CHANGELOG 更新をスキップするか確認する

**記述スタイル:**

- 各エントリは `- 変更内容の要約` 形式
- カテゴリは `###` ヘッダーで分類（Added, Changed, Fixed, Removed, Breaking Changes）
- 既存の CHANGELOG.md のスタイルに合わせる

### Step 6: Update CHANGELOG File

CHANGELOG.md に対して以下を実行する:

1. `## [Unreleased]` セクションの既存内容をクリアする
2. `## [Unreleased]` の直後に空行を挟んで新バージョンセクションを挿入する:
   ```
   ## [VERSION] - YYYY-MM-DD
   ```
3. 日付は実行日（`date +%Y-%m-%d` で取得）を使用する
4. Step 5 で生成/統合したエントリを配置する
5. ファイル末尾のバージョン比較リンクを更新する:
   - `[Unreleased]` リンクの比較先を新バージョンタグに変更
   - 新バージョンのリリースリンクを追加

**リンク更新例:**

```markdown
[Unreleased]: https://github.com/ToshikiImagawa/Buruma/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ToshikiImagawa/Buruma/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ToshikiImagawa/Buruma/releases/tag/v0.1.0
```

### Step 7: Update Version Manifest Files

3 ファイルのバージョンを一括更新する。

1. **package.json**: `"version": "OLD"` → `"version": "NEW"` に置換
2. **src-tauri/Cargo.toml**: `version = "OLD"` → `version = "NEW"` に置換
3. **src-tauri/tauri.conf.json**: `"version": "OLD"` → `"version": "NEW"` に置換

各ファイルの現在のバージョンを Read で確認してから Edit で更新する。3 ファイルすべてが同一バージョンに揃っていることを確認する。

### Step 8: Summary

更新結果のサマリーを [templates/output.md](templates/output.md) に従って表示する。

## Output Format

[templates/output.md](templates/output.md) のテンプレートに従って出力する。プレースホルダーを実際の値に置換すること。

## Notes

- このスキルは CHANGELOG の生成・編集とバージョン更新を行う。コミットや PR 作成は行わない
- 生成されたエントリは必ずユーザーにレビューを促す
- プレリリースバージョン（`-alpha`, `-beta`, `-rc.1` 等）もサポートする
