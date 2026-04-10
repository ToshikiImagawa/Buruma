//! Repository trait 定義 (application 層)。
//!
//! infrastructure 層で具象実装を提供し、UseCase / presentation 層から trait 経由で呼び出す。
//! `Send + Sync` を要求して `Arc<dyn Trait>` で `tauri::State<AppState>` に保持できるようにする。
//! async メソッドを持つ trait は `#[async_trait]` で object-safety を確保する。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::application_foundation::domain::{AppSettings, RecentRepository};

/// KV ストア (tauri-plugin-store) の CRUD インターフェース。
pub trait StoreRepository: Send + Sync {
    fn get_recent_repositories(&self) -> AppResult<Vec<RecentRepository>>;
    fn set_recent_repositories(&self, repos: &[RecentRepository]) -> AppResult<()>;
    fn get_settings(&self) -> AppResult<AppSettings>;
    fn set_settings(&self, settings: &AppSettings) -> AppResult<()>;
}

/// Git リポジトリ検証インターフェース。
#[async_trait]
pub trait GitValidationRepository: Send + Sync {
    async fn is_git_repository(&self, dir_path: &str) -> AppResult<bool>;
}

/// フォルダ選択ダイアログインターフェース。
#[async_trait]
pub trait DialogRepository: Send + Sync {
    async fn show_open_directory_dialog(&self) -> AppResult<Option<String>>;
}
