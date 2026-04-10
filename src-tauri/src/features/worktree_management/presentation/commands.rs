//! 7 #[tauri::command] for worktree-management.
//!
//! shim は camelCase (`{ repoPath }`) で invoke するため、Rust パラメータ名も
//! camelCase に合わせる (`#[allow(non_snake_case)]`)。Phase IH で shim 廃止時に
//! snake_case に統一予定。

#![allow(non_snake_case)]

use tauri::State;

use crate::error::AppError;
use crate::features::worktree_management::application::usecases;
use crate::features::worktree_management::domain::{
    WorktreeCreateParams, WorktreeDeleteParams, WorktreeInfo, WorktreeStatus,
};
use crate::state::AppState;

#[tauri::command]
pub async fn worktree_list(repoPath: String, state: State<'_, AppState>) -> Result<Vec<WorktreeInfo>, AppError> {
    let result = usecases::list_worktrees(state.worktree_repo.as_ref(), &repoPath).await;

    // watcher をリポジトリに対して開始/再開する
    if let Some(ref watcher) = state.worktree_watcher {
        if let Some(ref app) = *state.app_handle.lock().unwrap_or_else(|e| e.into_inner()) {
            watcher.start_watching(&repoPath, app.clone());
        }
    }

    result
}

#[tauri::command]
pub async fn worktree_status(
    _repoPath: String,
    worktreePath: String,
    state: State<'_, AppState>,
) -> Result<WorktreeStatus, AppError> {
    usecases::get_worktree_status(state.worktree_repo.as_ref(), &worktreePath).await
}

#[tauri::command]
pub async fn worktree_create(
    params: WorktreeCreateParams,
    state: State<'_, AppState>,
) -> Result<WorktreeInfo, AppError> {
    usecases::create_worktree(state.worktree_repo.as_ref(), &params).await
}

#[tauri::command]
pub async fn worktree_delete(params: WorktreeDeleteParams, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::delete_worktree(state.worktree_repo.as_ref(), &params.worktree_path, params.force).await
}

#[tauri::command]
pub async fn worktree_suggest_path(
    repoPath: String,
    branch: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    usecases::suggest_path(state.worktree_repo.as_ref(), &repoPath, &branch).await
}

#[tauri::command]
pub async fn worktree_check_dirty(worktreePath: String, state: State<'_, AppState>) -> Result<bool, AppError> {
    usecases::check_dirty(state.worktree_repo.as_ref(), &worktreePath).await
}

#[tauri::command]
pub async fn worktree_default_branch(repoPath: String, state: State<'_, AppState>) -> Result<String, AppError> {
    usecases::get_default_branch(state.worktree_repo.as_ref(), &repoPath).await
}
