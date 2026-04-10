//! application-foundation feature — リポジトリ管理 / 設定管理 / エラー通知。
//!
//! 対象 IPC: `repository_*` (6), `settings_*` (4), event `error-notify`

pub mod application;
pub mod domain;
pub mod infrastructure;
pub mod presentation;
