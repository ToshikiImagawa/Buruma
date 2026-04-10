//! WorktreeGitRepository trait — git worktree CLI 操作の抽象。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::worktree_management::domain::{
    WorktreeCreateParams, WorktreeInfo, WorktreeStatus,
};

#[async_trait]
pub trait WorktreeGitRepository: Send + Sync {
    async fn list_worktrees(&self, repo_path: &str) -> AppResult<Vec<WorktreeInfo>>;
    async fn get_status(&self, worktree_path: &str) -> AppResult<WorktreeStatus>;
    async fn add_worktree(&self, params: &WorktreeCreateParams) -> AppResult<WorktreeInfo>;
    async fn remove_worktree(&self, worktree_path: &str, force: bool) -> AppResult<()>;
    async fn is_dirty(&self, worktree_path: &str) -> AppResult<bool>;
    async fn get_default_branch(&self, repo_path: &str) -> AppResult<String>;
    async fn suggest_path(&self, repo_path: &str, branch: &str) -> AppResult<String>;
}
