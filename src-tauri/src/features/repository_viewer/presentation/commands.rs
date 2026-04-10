//! 10 #[tauri::command] for repository-viewer.
//!
//! shim は args/query をオブジェクトでラップして渡すため、
//! Rust パラメータ名は `args` / `query` で受ける。
//! 内部の camelCase フィールドは `#[serde(rename_all = "camelCase")]` で対応。

use tauri::State;

use crate::error::AppError;
use crate::features::repository_viewer::application::usecases;
use crate::features::repository_viewer::domain::{
    BranchList, CommitDetail, CommitDetailArgs, DiffCommitArgs, FileContentArgs, FileContentCommitArgs, FileContents,
    FileDiff, FileTreeNode, GitDiffQuery, GitLogQuery, GitLogResult, GitStatus, StatusArgs,
};
use crate::state::AppState;

#[tauri::command]
pub async fn git_status(args: StatusArgs, state: State<'_, AppState>) -> Result<GitStatus, AppError> {
    usecases::get_status(state.git_read_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_log(query: GitLogQuery, state: State<'_, AppState>) -> Result<GitLogResult, AppError> {
    usecases::get_log(state.git_read_repo.as_ref(), &query).await
}

#[tauri::command]
pub async fn git_commit_detail(args: CommitDetailArgs, state: State<'_, AppState>) -> Result<CommitDetail, AppError> {
    usecases::get_commit_detail(state.git_read_repo.as_ref(), &args.worktree_path, &args.hash).await
}

#[tauri::command]
pub async fn git_diff(query: GitDiffQuery, state: State<'_, AppState>) -> Result<Vec<FileDiff>, AppError> {
    usecases::get_diff(
        state.git_read_repo.as_ref(),
        &query.worktree_path,
        query.file_path.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn git_diff_staged(query: GitDiffQuery, state: State<'_, AppState>) -> Result<Vec<FileDiff>, AppError> {
    usecases::get_diff_staged(
        state.git_read_repo.as_ref(),
        &query.worktree_path,
        query.file_path.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn git_diff_commit(args: DiffCommitArgs, state: State<'_, AppState>) -> Result<Vec<FileDiff>, AppError> {
    usecases::get_diff_commit(
        state.git_read_repo.as_ref(),
        &args.worktree_path,
        &args.hash,
        args.file_path.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn git_branches(args: StatusArgs, state: State<'_, AppState>) -> Result<BranchList, AppError> {
    usecases::get_branches(state.git_read_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_file_tree(args: StatusArgs, state: State<'_, AppState>) -> Result<FileTreeNode, AppError> {
    usecases::get_file_tree(state.git_read_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_file_contents(args: FileContentArgs, state: State<'_, AppState>) -> Result<FileContents, AppError> {
    usecases::get_file_contents(
        state.git_read_repo.as_ref(),
        &args.worktree_path,
        &args.file_path,
        args.staged.unwrap_or(false),
    )
    .await
}

#[tauri::command]
pub async fn git_file_contents_commit(
    args: FileContentCommitArgs,
    state: State<'_, AppState>,
) -> Result<FileContents, AppError> {
    usecases::get_file_contents_commit(
        state.git_read_repo.as_ref(),
        &args.worktree_path,
        &args.hash,
        &args.file_path,
    )
    .await
}
