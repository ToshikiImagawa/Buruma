//! GitWriteRepository trait — git 書き込み操作の抽象。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::basic_git_operations::domain::{
    BranchCheckoutArgs, BranchCreateArgs, BranchDeleteArgs, CommitArgs, CommitResult, FetchArgs,
    FetchResult, PullArgs, PullResult, PushArgs, PushResult, ResetArgs,
};

#[async_trait]
pub trait GitWriteRepository: Send + Sync {
    async fn stage(&self, worktree_path: &str, files: &[String]) -> AppResult<()>;
    async fn stage_all(&self, worktree_path: &str) -> AppResult<()>;
    async fn unstage(&self, worktree_path: &str, files: &[String]) -> AppResult<()>;
    async fn unstage_all(&self, worktree_path: &str) -> AppResult<()>;
    async fn commit(&self, args: &CommitArgs) -> AppResult<CommitResult>;
    async fn push(&self, args: &PushArgs) -> AppResult<PushResult>;
    async fn pull(&self, args: &PullArgs) -> AppResult<PullResult>;
    async fn fetch(&self, args: &FetchArgs) -> AppResult<FetchResult>;
    async fn branch_create(&self, args: &BranchCreateArgs) -> AppResult<()>;
    async fn branch_checkout(&self, args: &BranchCheckoutArgs) -> AppResult<()>;
    async fn branch_delete(&self, args: &BranchDeleteArgs) -> AppResult<()>;
    async fn reset(&self, args: &ResetArgs) -> AppResult<()>;
}
