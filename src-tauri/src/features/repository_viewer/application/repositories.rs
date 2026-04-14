//! GitReadRepository trait — git 読み取り操作の抽象。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::repository_viewer::domain::{
    BranchList, CommitDetail, FileContents, FileDiff, FileTreeNode, GitLogQuery, GitLogResult, GitStatus,
};

#[async_trait]
pub trait GitReadRepository: Send + Sync {
    async fn get_status(&self, worktree_path: &str) -> AppResult<GitStatus>;
    async fn get_log(&self, query: &GitLogQuery) -> AppResult<GitLogResult>;
    async fn get_commit_detail(&self, worktree_path: &str, hash: &str) -> AppResult<CommitDetail>;
    async fn get_diff(&self, worktree_path: &str, file_path: Option<&str>) -> AppResult<Vec<FileDiff>>;
    async fn get_diff_staged(&self, worktree_path: &str, file_path: Option<&str>) -> AppResult<Vec<FileDiff>>;
    async fn get_diff_commit(
        &self,
        worktree_path: &str,
        hash: &str,
        file_path: Option<&str>,
    ) -> AppResult<Vec<FileDiff>>;
    async fn get_branches(&self, worktree_path: &str) -> AppResult<BranchList>;
    async fn get_file_tree(&self, worktree_path: &str) -> AppResult<FileTreeNode>;
    async fn get_file_contents(&self, worktree_path: &str, file_path: &str, staged: bool) -> AppResult<FileContents>;
    async fn get_file_contents_commit(
        &self,
        worktree_path: &str,
        hash: &str,
        file_path: &str,
    ) -> AppResult<FileContents>;
}
