//! アプリケーション全体で共有される状態。

use std::sync::{Arc, Mutex};

use crate::features::application_foundation::application::repositories::{
    DialogRepository, GitValidationRepository, StoreRepository,
};
use crate::features::application_foundation::infrastructure::dialog::TauriDialogRepository;
use crate::features::application_foundation::infrastructure::git_validation::DefaultGitValidationRepository;
use crate::features::application_foundation::infrastructure::store::TauriStoreRepository;
use crate::features::basic_git_operations::application::repositories::GitWriteRepository;
use crate::features::basic_git_operations::infrastructure::git_repository::DefaultGitWriteRepository;
use crate::features::repository_viewer::application::repositories::GitReadRepository;
use crate::features::repository_viewer::infrastructure::git_repository::DefaultGitReadRepository;
use crate::features::worktree_management::application::repositories::WorktreeGitRepository;
use crate::features::worktree_management::infrastructure::git_repository::DefaultWorktreeGitRepository;
use crate::features::worktree_management::infrastructure::watcher::WorktreeWatcher;

pub struct AppState {
    // application-foundation
    pub store_repo: Arc<dyn StoreRepository>,
    pub git_validation_repo: Arc<dyn GitValidationRepository>,
    pub dialog_repo: Arc<dyn DialogRepository>,
    // basic-git-operations
    pub git_write_repo: Arc<dyn GitWriteRepository>,
    // repository-viewer
    pub git_read_repo: Arc<dyn GitReadRepository>,
    // worktree-management
    pub worktree_repo: Arc<dyn WorktreeGitRepository>,
    pub worktree_watcher: Option<WorktreeWatcher>,
    pub app_handle: Mutex<Option<tauri::AppHandle>>,
}

impl AppState {
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        Self {
            store_repo: Arc::new(TauriStoreRepository::new(app_handle.clone())),
            git_validation_repo: Arc::new(DefaultGitValidationRepository),
            dialog_repo: Arc::new(TauriDialogRepository::new(app_handle.clone())),
            git_write_repo: Arc::new(DefaultGitWriteRepository),
            git_read_repo: Arc::new(DefaultGitReadRepository),
            worktree_repo: Arc::new(DefaultWorktreeGitRepository),
            worktree_watcher: Some(WorktreeWatcher::new()),
            app_handle: Mutex::new(Some(app_handle.clone())),
        }
    }
}
