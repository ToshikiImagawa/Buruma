//! UseCase 実装 — 旧 TS worktree-management を 1:1 移植。

use crate::error::{AppError, AppResult};
use crate::features::worktree_management::application::repositories::WorktreeGitRepository;
use crate::features::worktree_management::application::symlink_interfaces::{
    SymlinkConfigRepository, SymlinkFileRepository,
};
use crate::features::worktree_management::application::symlink_service::SymlinkService;
use crate::features::worktree_management::domain::{
    BranchDeleteResult, WorktreeCreateParams, WorktreeCreateResult, WorktreeDeleteParams, WorktreeInfo, WorktreeStatus,
};

pub async fn list_worktrees(repo: &dyn WorktreeGitRepository, repo_path: &str) -> AppResult<Vec<WorktreeInfo>> {
    repo.list_worktrees(repo_path).await
}

pub async fn get_worktree_status(repo: &dyn WorktreeGitRepository, worktree_path: &str) -> AppResult<WorktreeStatus> {
    repo.get_status(worktree_path).await
}

pub async fn create_worktree(
    repo: &dyn WorktreeGitRepository,
    symlink_config_repo: &dyn SymlinkConfigRepository,
    symlink_file_repo: &dyn SymlinkFileRepository,
    params: &WorktreeCreateParams,
) -> AppResult<WorktreeCreateResult> {
    // 1. ワークツリー作成
    let worktree = repo.add_worktree(params).await?;

    // 2. シンボリックリンク設定を取得（エラー時は symlink=None で続行）
    let symlink = match symlink_config_repo.get_config(&params.repo_path).await {
        Ok(config) if !config.patterns.is_empty() => {
            // 3. メインWTパスを特定（git rev-parse --git-common-dir ベース）
            match repo.get_main_worktree_path(&params.repo_path).await {
                Ok(main_path) => {
                    let service = SymlinkService::new(symlink_file_repo);
                    Some(service.execute(&main_path, &worktree.path, &config).await)
                }
                Err(_) => None,
            }
        }
        _ => None,
    };

    Ok(WorktreeCreateResult { worktree, symlink })
}

pub async fn delete_worktree(
    repo: &dyn WorktreeGitRepository,
    params: &WorktreeDeleteParams,
) -> AppResult<Option<BranchDeleteResult>> {
    let worktree_path = &params.worktree_path;

    // メインワークツリーの削除を防止（安全性要件 B-002）
    if repo.is_main_worktree(worktree_path).await? {
        return Err(AppError::GitOperation {
            code: "CANNOT_DELETE_MAIN_WORKTREE".to_string(),
            message: "メインワークツリーは削除できません".to_string(),
        });
    }
    // force=false かつ dirty な場合、git の stderr パースに頼らず事前検出して構造化エラーを返す
    if !params.force && repo.is_dirty(worktree_path).await.unwrap_or(false) {
        return Err(AppError::GitOperation {
            code: "WORKTREE_DIRTY".to_string(),
            message: "未コミットの変更があるため削除できません".to_string(),
        });
    }

    // 削除前にブランチ名を取得（worktree 削除後は取得できなくなるため）
    let branch_name = if params.delete_branch {
        let worktrees = repo.list_worktrees(&params.repo_path).await.unwrap_or_default();
        worktrees
            .iter()
            .find(|wt| wt.path == *worktree_path)
            .and_then(|wt| wt.branch.clone())
            .map(|branch| (branch, worktrees))
    } else {
        None
    };

    repo.remove_worktree(worktree_path, params.force).await?;

    if let Some((branch, worktrees)) = branch_name {
        let is_used = worktrees
            .iter()
            .any(|wt| wt.path != *worktree_path && wt.branch.as_deref() == Some(&branch));
        if is_used {
            return Ok(Some(BranchDeleteResult::Skipped {
                branch_name: branch,
                skip_reason: "他のワークツリーで使用中です".to_string(),
            }));
        }
        let result = repo.delete_branch(&params.repo_path, &branch, false).await?;
        return Ok(Some(result));
    }

    Ok(None)
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
