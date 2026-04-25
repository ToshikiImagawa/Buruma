# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-04-25

### Added

- Claude AI チャットの会話管理機能（会話履歴の一覧・切り替え・削除、メッセージ表示）
- Claude AI チャットの会話永続化とセッション復元機能（過去の会話を再開可能）
- Claude AI チャットの応答を Markdown でレンダリングする機能
- AI モデル選択 UI（Popover 型セレクター、フィルタリング、プリセット選択）
- プッシュ時の Force push（`--force-with-lease`）オプション
- ファイルの右クリックメニューから外部エディタ・デフォルトアプリで開く機能
- Git コマンドの並行実行を防ぐロック機構

### Fixed

- IME 入力中に意図しない送信が発生する問題を修正
- `git fetch` 後にリモートで削除されたブランチの追跡参照が残る問題を修正
- macOS で PATH 環境変数が正しく解決されない問題を修正

## [0.2.0] - 2026-04-20

### Added

- `git rebase --onto` コマンド対応（リベース時に新しいベースブランチを指定可能）
- ワークツリー削除時にローカルブランチを同時に削除するオプション
- AI によるコンフリクト自動解決機能（Claude Code CLI 連携）
- コンフリクトファイルの内容を非同期で取得・表示する機能

### Changed

- コミットメッセージ生成時にユーザー定義のコミットメッセージルールを反映するよう改善

### Fixed

- リベースエディターでリベースが再実行を繰り返す問題を修正
- リベースの状態管理とダイアログ表示の不具合を修正

## [0.1.0] - 2026-04-11

### Added

- Tauri v2 + React + TypeScript によるデスクトップアプリケーション基盤
- Git リポジトリのオープン・切り替え・最近使ったリポジトリ管理
- Git 履歴、差分、ブランチの閲覧機能
- ステージ、コミット、プッシュ、プル、ブランチ操作
- マージ、リベース、スタッシュ、チェリーピック、コンフリクト解決
- Worktree の作成・削除・一覧・監視機能
- Claude Code 連携によるレビュー・解説・コミットメッセージ生成
- macOS / Linux / Windows 対応

[Unreleased]: https://github.com/ToshikiImagawa/Buruma/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/ToshikiImagawa/Buruma/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ToshikiImagawa/Buruma/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ToshikiImagawa/Buruma/releases/tag/v0.1.0
