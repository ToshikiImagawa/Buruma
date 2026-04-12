//! UseCase 実装 — 旧 TS worktree-management を 1:1 移植。

use crate::error::{AppError, AppResult};
use crate::features::worktree_management::application::repositories::WorktreeGitRepository;
use crate::features::worktree_management::domain::{WorktreeCreateParams, WorktreeInfo, WorktreeStatus};

pub async fn list_worktrees(repo: &dyn WorktreeGitRepository, repo_path: &str) -> AppResult<Vec<WorktreeInfo>> {
    repo.list_worktrees(repo_path).await
}

pub async fn get_worktree_status(repo: &dyn WorktreeGitRepository, worktree_path: &str) -> AppResult<WorktreeStatus> {
    repo.get_status(worktree_path).await
}

pub async fn create_worktree(
    repo: &dyn WorktreeGitRepository,
    params: &WorktreeCreateParams,
) -> AppResult<WorktreeInfo> {
    repo.add_worktree(params).await
}

pub async fn delete_worktree(repo: &dyn WorktreeGitRepository, worktree_path: &str, force: bool) -> AppResult<()> {
    // メインワークツリーの削除を防止（安全性要件 B-002）
    if repo.is_main_worktree(worktree_path).await? {
        return Err(AppError::GitOperation {
            code: "CANNOT_DELETE_MAIN_WORKTREE".to_string(),
            message: "メインワークツリーは削除できません".to_string(),
        });
    }
    repo.remove_worktree(worktree_path, force).await.map_err(|e| {
        // force=false で dirty worktree エラーの場合、フロントエンドが force delete を提案できるよう構造化
        if !force {
            let msg = e.to_string();
            if msg.contains("--force") || msg.contains("dirty") || msg.contains("untracked") {
                return AppError::GitOperation {
                    code: "WORKTREE_DIRTY".to_string(),
                    message: msg,
                };
            }
        }
        e
    })
}

pub async fn suggest_path(repo: &dyn WorktreeGitRepository, repo_path: &str, branch: &str) -> AppResult<String> {
    repo.suggest_path(repo_path, branch).await
}

pub async fn check_dirty(repo: &dyn WorktreeGitRepository, worktree_path: &str) -> AppResult<bool> {
    repo.is_dirty(worktree_path).await
}

pub async fn get_default_branch(repo: &dyn WorktreeGitRepository, repo_path: &str) -> AppResult<String> {
    repo.get_default_branch(repo_path).await
}
