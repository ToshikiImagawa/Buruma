//! 12 #[tauri::command] for basic-git-operations.

use tauri::State;

use crate::error::AppError;
use crate::features::basic_git_operations::application::usecases;
use crate::features::basic_git_operations::domain::{
    BranchCheckoutArgs, BranchCreateArgs, BranchDeleteArgs, CommitArgs, CommitResult, FetchArgs,
    FetchResult, PullArgs, PullResult, PushArgs, PushResult, ResetArgs, StageArgs,
    WorktreePathArgs,
};
use crate::state::AppState;

#[tauri::command]
pub async fn git_stage(args: StageArgs, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::stage(
        state.git_write_repo.as_ref(),
        &args.worktree_path,
        &args.files,
    )
    .await
}

#[tauri::command]
pub async fn git_stage_all(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::stage_all(state.git_write_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_unstage(args: StageArgs, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::unstage(
        state.git_write_repo.as_ref(),
        &args.worktree_path,
        &args.files,
    )
    .await
}

#[tauri::command]
pub async fn git_unstage_all(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::unstage_all(state.git_write_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_commit(
    args: CommitArgs,
    state: State<'_, AppState>,
) -> Result<CommitResult, AppError> {
    usecases::commit(state.git_write_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_push(args: PushArgs, state: State<'_, AppState>) -> Result<PushResult, AppError> {
    usecases::push(state.git_write_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_pull(args: PullArgs, state: State<'_, AppState>) -> Result<PullResult, AppError> {
    usecases::pull(state.git_write_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_fetch(
    args: FetchArgs,
    state: State<'_, AppState>,
) -> Result<FetchResult, AppError> {
    usecases::fetch(state.git_write_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_branch_create(
    args: BranchCreateArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::branch_create(state.git_write_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_branch_checkout(
    args: BranchCheckoutArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::branch_checkout(state.git_write_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_branch_delete(
    args: BranchDeleteArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::branch_delete(state.git_write_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_reset(args: ResetArgs, state: State<'_, AppState>) -> Result<(), AppError> {
    usecases::reset(state.git_write_repo.as_ref(), &args).await
}
