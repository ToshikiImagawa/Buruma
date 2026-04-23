//! `#[tauri::command]` 関数群 — 12 commands for application-foundation feature.
//!
//! 各 command は AppState から Repository を取得し、UseCase を呼び出す。
//! 戻り値は `Result<T, AppError>` で、Tauri が自動的に JSON シリアライズする。
//! 失敗時は AppError の Serialize 実装により `{ code, message, detail }` 形状で
//! Webview に渡り、`invokeCommand<T>` の catch 節で `IPCResult<T>` に変換される。

use tauri::State;

use crate::error::AppError;
use crate::features::application_foundation::application::usecases;
use crate::features::application_foundation::domain::{AppSettings, RecentRepository, RepositoryInfo, Theme};
use crate::state::AppState;

#[tauri::command]
pub async fn repository_open(state: State<'_, AppState>) -> Result<Option<RepositoryInfo>, AppError> {
    usecases::open_repository_with_dialog(
        state.store_repo.as_ref(),
        state.git_validation_repo.as_ref(),
        state.dialog_repo.as_ref(),
    )
    .await
}

#[tauri::command]
pub async fn repository_open_path(
    path: String,
    state: State<'_, AppState>,
) -> Result<Option<RepositoryInfo>, AppError> {
    usecases::open_repository_by_path(state.store_repo.as_ref(), state.git_validation_repo.as_ref(), &path).await
}

#[tauri::command]
pub async fn repository_validate(path: String, state: State<'_, AppState>) -> Result<bool, AppError> {
    usecases::validate_repository(state.git_validation_repo.as_ref(), &path).await
}

#[tauri::command]
pub fn repository_get_recent(state: State<'_, AppState>) -> Result<Vec<RecentRepository>, AppError> {
    usecases::get_recent_repositories(state.store_repo.as_ref())
}

#[tauri::command]
pub fn repository_remove_recent(path: String, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::remove_recent_repository(state.store_repo.as_ref(), &path)
}

#[tauri::command]
pub fn repository_pin(path: String, pinned: bool, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::pin_repository(state.store_repo.as_ref(), &path, pinned)
}

#[tauri::command]
pub fn settings_get(state: State<'_, AppState>) -> Result<AppSettings, AppError> {
    usecases::get_settings(state.store_repo.as_ref())
}

#[tauri::command]
pub fn settings_set(settings: AppSettings, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::update_settings(state.store_repo.as_ref(), &settings)
}

#[tauri::command]
pub fn settings_get_theme(state: State<'_, AppState>) -> Result<Theme, AppError> {
    usecases::get_theme(state.store_repo.as_ref())
}

#[tauri::command]
pub fn settings_set_theme(theme: Theme, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::set_theme(state.store_repo.as_ref(), theme)
}

#[tauri::command]
pub fn open_in_editor(path: String, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::open_in_editor(state.store_repo.as_ref(), &path)
}

#[tauri::command]
pub async fn select_external_editor_app(state: State<'_, AppState>) -> Result<Option<String>, AppError> {
    usecases::select_external_editor_app(state.store_repo.as_ref(), state.dialog_repo.as_ref()).await
}
