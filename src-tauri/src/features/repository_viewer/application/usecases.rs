//! repository-viewer UseCase 関数（10 個）。
//! 全て GitReadRepository trait に委譲する thin wrapper。

use crate::error::AppResult;
use crate::features::repository_viewer::application::repositories::GitReadRepository;
use crate::features::repository_viewer::domain::{
    BranchList, CommitDetail, FileContents, FileDiff, FileTreeNode, GitLogQuery, GitLogResult,
    GitStatus,
};

pub async fn get_status(repo: &dyn GitReadRepository, worktree_path: &str) -> AppResult<GitStatus> {
    repo.get_status(worktree_path).await
}

pub async fn get_log(repo: &dyn GitReadRepository, query: &GitLogQuery) -> AppResult<GitLogResult> {
    repo.get_log(query).await
}

pub async fn get_commit_detail(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
    hash: &str,
) -> AppResult<CommitDetail> {
    repo.get_commit_detail(worktree_path, hash).await
}

pub async fn get_diff(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
    file_path: Option<&str>,
) -> AppResult<Vec<FileDiff>> {
    repo.get_diff(worktree_path, file_path).await
}

pub async fn get_diff_staged(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
    file_path: Option<&str>,
) -> AppResult<Vec<FileDiff>> {
    repo.get_diff_staged(worktree_path, file_path).await
}

pub async fn get_diff_commit(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
    hash: &str,
    file_path: Option<&str>,
) -> AppResult<Vec<FileDiff>> {
    repo.get_diff_commit(worktree_path, hash, file_path).await
}

pub async fn get_branches(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
) -> AppResult<BranchList> {
    repo.get_branches(worktree_path).await
}

pub async fn get_file_tree(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
) -> AppResult<FileTreeNode> {
    repo.get_file_tree(worktree_path).await
}

pub async fn get_file_contents(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
    file_path: &str,
    staged: bool,
) -> AppResult<FileContents> {
    repo.get_file_contents(worktree_path, file_path, staged)
        .await
}

pub async fn get_file_contents_commit(
    repo: &dyn GitReadRepository,
    worktree_path: &str,
    hash: &str,
    file_path: &str,
) -> AppResult<FileContents> {
    repo.get_file_contents_commit(worktree_path, hash, file_path)
        .await
}
