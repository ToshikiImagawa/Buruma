//! アプリケーション全体で共有される状態。
//!
//! `tauri::State<AppState>` として `#[tauri::command]` 関数に注入される。
//! 各 Repository の具象実装は `AppState::new()` で生成し、trait object として保持する。

use std::sync::Arc;

use crate::features::application_foundation::application::repositories::{
    DialogRepository, GitValidationRepository, StoreRepository,
};
use crate::features::application_foundation::infrastructure::dialog::TauriDialogRepository;
use crate::features::application_foundation::infrastructure::git_validation::DefaultGitValidationRepository;
use crate::features::application_foundation::infrastructure::store::TauriStoreRepository;

pub struct AppState {
    pub store_repo: Arc<dyn StoreRepository>,
    pub git_validation_repo: Arc<dyn GitValidationRepository>,
    pub dialog_repo: Arc<dyn DialogRepository>,
}

impl AppState {
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        Self {
            store_repo: Arc::new(TauriStoreRepository::new(app_handle.clone())),
            git_validation_repo: Arc::new(DefaultGitValidationRepository),
            dialog_repo: Arc::new(TauriDialogRepository::new(app_handle.clone())),
        }
    }
}
