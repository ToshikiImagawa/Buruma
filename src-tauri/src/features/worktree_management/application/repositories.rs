//! WorktreeGitRepository trait — git worktree CLI 操作の抽象。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::worktree_management::domain::{
    BranchDeleteResult, WorktreeCreateParams, WorktreeInfo, WorktreeStatus,
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
    async fn is_main_worktree(&self, worktree_path: &str) -> AppResult<bool>;
    /// メインワークツリーのパスを取得する（git rev-parse --git-common-dir ベース）。
    async fn get_main_worktree_path(&self, repo_path: &str) -> AppResult<String>;
    /// ローカルブランチを削除する。
    /// force=false: `git branch -d`, force=true: `git branch -D`
    async fn delete_branch(&self, repo_path: &str, branch: &str, force: bool) -> AppResult<BranchDeleteResult>;
}
