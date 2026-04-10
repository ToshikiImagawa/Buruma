//! basic-git-operations UseCase 関数（12 個）。

use crate::error::AppResult;
use crate::features::basic_git_operations::application::repositories::GitWriteRepository;
use crate::features::basic_git_operations::domain::{
    BranchCheckoutArgs, BranchCreateArgs, BranchDeleteArgs, CommitArgs, CommitResult, FetchArgs,
    FetchResult, PullArgs, PullResult, PushArgs, PushResult, ResetArgs,
};

pub async fn stage(
    repo: &dyn GitWriteRepository,
    worktree_path: &str,
    files: &[String],
) -> AppResult<()> {
    repo.stage(worktree_path, files).await
}

pub async fn stage_all(repo: &dyn GitWriteRepository, worktree_path: &str) -> AppResult<()> {
    repo.stage_all(worktree_path).await
}

pub async fn unstage(
    repo: &dyn GitWriteRepository,
    worktree_path: &str,
    files: &[String],
) -> AppResult<()> {
    repo.unstage(worktree_path, files).await
}

pub async fn unstage_all(repo: &dyn GitWriteRepository, worktree_path: &str) -> AppResult<()> {
    repo.unstage_all(worktree_path).await
}

pub async fn commit(repo: &dyn GitWriteRepository, args: &CommitArgs) -> AppResult<CommitResult> {
    repo.commit(args).await
}

pub async fn push(repo: &dyn GitWriteRepository, args: &PushArgs) -> AppResult<PushResult> {
    repo.push(args).await
}

pub async fn pull(repo: &dyn GitWriteRepository, args: &PullArgs) -> AppResult<PullResult> {
    repo.pull(args).await
}

pub async fn fetch(repo: &dyn GitWriteRepository, args: &FetchArgs) -> AppResult<FetchResult> {
    repo.fetch(args).await
}

pub async fn branch_create(
    repo: &dyn GitWriteRepository,
    args: &BranchCreateArgs,
) -> AppResult<()> {
    repo.branch_create(args).await
}

pub async fn branch_checkout(
    repo: &dyn GitWriteRepository,
    args: &BranchCheckoutArgs,
) -> AppResult<()> {
    repo.branch_checkout(args).await
}

pub async fn branch_delete(
    repo: &dyn GitWriteRepository,
    args: &BranchDeleteArgs,
) -> AppResult<()> {
    repo.branch_delete(args).await
}

pub async fn reset(repo: &dyn GitWriteRepository, args: &ResetArgs) -> AppResult<()> {
    repo.reset(args).await
}
