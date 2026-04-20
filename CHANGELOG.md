# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/ToshikiImagawa/Buruma/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ToshikiImagawa/Buruma/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ToshikiImagawa/Buruma/releases/tag/v0.1.0
