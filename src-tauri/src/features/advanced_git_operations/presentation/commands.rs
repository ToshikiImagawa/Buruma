//! 24 #[tauri::command] for advanced-git-operations.

use tauri::State;

use crate::error::AppError;
use crate::features::advanced_git_operations::application::usecases;
use crate::features::advanced_git_operations::domain::{
    CherryPickOptions, CherryPickResult, ConflictFile, ConflictFileArgs, ConflictResolveAllOptions,
    ConflictResolveOptions, InteractiveRebaseOptions, MergeOptions, MergeResult, MergeStatus,
    RebaseGetCommitsArgs, RebaseOptions, RebaseResult, RebaseStep, StashEntry, StashIndexArgs,
    StashSaveOptions, TagCreateOptions, TagDeleteArgs, TagInfo, ThreeWayContent, WorktreePathArgs,
};
use crate::state::AppState;

// --- Merge ---

#[tauri::command]
pub async fn git_merge(
    args: MergeOptions,
    state: State<'_, AppState>,
) -> Result<MergeResult, AppError> {
    usecases::merge(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_merge_abort(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::merge_abort(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_merge_status(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<MergeStatus, AppError> {
    usecases::merge_status(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

// --- Rebase ---

#[tauri::command]
pub async fn git_rebase(
    args: RebaseOptions,
    state: State<'_, AppState>,
) -> Result<RebaseResult, AppError> {
    usecases::rebase(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_rebase_interactive(
    args: InteractiveRebaseOptions,
    state: State<'_, AppState>,
) -> Result<RebaseResult, AppError> {
    usecases::rebase_interactive(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_rebase_abort(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::rebase_abort(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_rebase_continue(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<RebaseResult, AppError> {
    usecases::rebase_continue(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_rebase_get_commits(
    args: RebaseGetCommitsArgs,
    state: State<'_, AppState>,
) -> Result<Vec<RebaseStep>, AppError> {
    usecases::rebase_get_commits(
        state.git_advanced_repo.as_ref(),
        &args.worktree_path,
        &args.onto,
    )
    .await
}

// --- Stash ---

#[tauri::command]
pub async fn git_stash_save(
    args: StashSaveOptions,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::stash_save(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_stash_list(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<Vec<StashEntry>, AppError> {
    usecases::stash_list(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_stash_pop(
    args: StashIndexArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::stash_pop(
        state.git_advanced_repo.as_ref(),
        &args.worktree_path,
        args.index,
    )
    .await
}

#[tauri::command]
pub async fn git_stash_apply(
    args: StashIndexArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::stash_apply(
        state.git_advanced_repo.as_ref(),
        &args.worktree_path,
        args.index,
    )
    .await
}

#[tauri::command]
pub async fn git_stash_drop(
    args: StashIndexArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::stash_drop(
        state.git_advanced_repo.as_ref(),
        &args.worktree_path,
        args.index,
    )
    .await
}

#[tauri::command]
pub async fn git_stash_clear(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::stash_clear(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

// --- Cherry-pick ---

#[tauri::command]
pub async fn git_cherry_pick(
    args: CherryPickOptions,
    state: State<'_, AppState>,
) -> Result<CherryPickResult, AppError> {
    usecases::cherry_pick(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_cherry_pick_abort(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::cherry_pick_abort(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

// --- Conflict ---

#[tauri::command]
pub async fn git_conflict_list(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<Vec<ConflictFile>, AppError> {
    usecases::conflict_list(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_conflict_file_content(
    args: ConflictFileArgs,
    state: State<'_, AppState>,
) -> Result<ThreeWayContent, AppError> {
    usecases::conflict_file_content(
        state.git_advanced_repo.as_ref(),
        &args.worktree_path,
        &args.file_path,
    )
    .await
}

#[tauri::command]
pub async fn git_conflict_resolve(
    args: ConflictResolveOptions,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::conflict_resolve(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_conflict_resolve_all(
    args: ConflictResolveAllOptions,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::conflict_resolve_all(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_conflict_mark_resolved(
    args: ConflictFileArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::conflict_mark_resolved(
        state.git_advanced_repo.as_ref(),
        &args.worktree_path,
        &args.file_path,
    )
    .await
}

// --- Tag ---

#[tauri::command]
pub async fn git_tag_list(
    args: WorktreePathArgs,
    state: State<'_, AppState>,
) -> Result<Vec<TagInfo>, AppError> {
    usecases::tag_list(state.git_advanced_repo.as_ref(), &args.worktree_path).await
}

#[tauri::command]
pub async fn git_tag_create(
    args: TagCreateOptions,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::tag_create(state.git_advanced_repo.as_ref(), &args).await
}

#[tauri::command]
pub async fn git_tag_delete(
    args: TagDeleteArgs,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    usecases::tag_delete(
        state.git_advanced_repo.as_ref(),
        &args.worktree_path,
        &args.tag_name,
    )
    .await
}
