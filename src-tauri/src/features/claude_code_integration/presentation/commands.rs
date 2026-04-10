//! 12 #[tauri::command] for claude-code-integration.

use tauri::State;

use crate::error::AppError;
use crate::features::claude_code_integration::application::usecases;
use crate::features::claude_code_integration::domain::{
    ClaudeAuthStatus, ClaudeCommand, ClaudeOutput, ClaudeSession, DiffReviewArgs,
    GenerateCommitMessageArgs, WorktreePathArgs,
};
use crate::state::AppState;

// --- Session ---

#[tauri::command]
pub async fn claude_start_session(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<ClaudeSession, AppError> {
    usecases::start_session(state.claude_repo.as_ref(), &args.worktree_path, app).await
}

#[tauri::command]
pub async fn claude_stop_session(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    usecases::stop_session(state.claude_repo.as_ref(), &args.worktree_path, app).await
}

#[tauri::command]
pub async fn claude_get_session(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<Option<ClaudeSession>, AppError> {
    usecases::get_session(state.claude_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn claude_get_all_sessions(
    state: State<'_, AppState>,
) -> Result<Vec<ClaudeSession>, AppError> {
    usecases::get_all_sessions(state.claude_repo.as_ref()).await
}

// --- Command / Output ---

#[tauri::command]
pub async fn claude_send_command(
    command: ClaudeCommand,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    usecases::send_command(state.claude_repo.as_ref(), &command, app).await
}

#[tauri::command]
pub async fn claude_get_output(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<Vec<ClaudeOutput>, AppError> {
    usecases::get_output(state.claude_repo.as_ref(), &args.worktree_path).await
}

// --- Auth ---

#[tauri::command]
pub async fn claude_check_auth(state: State<'_, AppState>) -> Result<ClaudeAuthStatus, AppError> {
    usecases::check_auth(state.claude_repo.as_ref()).await
}

#[tauri::command]
pub async fn claude_login(state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::login(state.claude_repo.as_ref()).await
}

#[tauri::command]
pub async fn claude_logout(state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::logout(state.claude_repo.as_ref()).await
}

// --- AI Operations ---

#[tauri::command]
pub async fn claude_generate_commit_message(
    args: GenerateCommitMessageArgs,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    usecases::generate_commit_message(state.claude_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn claude_review_diff(
    args: DiffReviewArgs,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    usecases::review_diff(state.claude_repo.as_ref(), &args, app).await
}

#[tauri::command]
pub async fn claude_explain_diff(
    args: DiffReviewArgs,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), AppError> {
    usecases::explain_diff(state.claude_repo.as_ref(), &args, app).await
}
