//! GitAdvancedRepository trait — 高度な git 操作の抽象。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::advanced_git_operations::domain::{
    CherryPickOptions, CherryPickResult, ConflictFile, ConflictResolveAllOptions, ConflictResolveOptions,
    InteractiveRebaseOptions, MergeOptions, MergeResult, MergeStatus, RebaseOptions, RebaseResult, RebaseStep,
    StashEntry, StashSaveOptions, TagCreateOptions, TagInfo, ThreeWayContent,
};

#[async_trait]
pub trait GitAdvancedRepository: Send + Sync {
    // Merge
    async fn merge(&self, options: &MergeOptions) -> AppResult<MergeResult>;
    async fn merge_abort(&self, worktree_path: &str) -> AppResult<()>;
    async fn merge_status(&self, worktree_path: &str) -> AppResult<MergeStatus>;
    // Rebase
    async fn rebase(&self, options: &RebaseOptions) -> AppResult<RebaseResult>;
    async fn rebase_interactive(&self, options: &InteractiveRebaseOptions) -> AppResult<RebaseResult>;
    async fn rebase_abort(&self, worktree_path: &str) -> AppResult<()>;
    async fn rebase_continue(&self, worktree_path: &str) -> AppResult<RebaseResult>;
    async fn rebase_get_commits(
        &self,
        worktree_path: &str,
        onto: &str,
        upstream: Option<&str>,
    ) -> AppResult<Vec<RebaseStep>>;
    // Stash
    async fn stash_save(&self, options: &StashSaveOptions) -> AppResult<()>;
    async fn stash_list(&self, worktree_path: &str) -> AppResult<Vec<StashEntry>>;
    async fn stash_pop(&self, worktree_path: &str, index: u32) -> AppResult<()>;
    async fn stash_apply(&self, worktree_path: &str, index: u32) -> AppResult<()>;
    async fn stash_drop(&self, worktree_path: &str, index: u32) -> AppResult<()>;
    async fn stash_clear(&self, worktree_path: &str) -> AppResult<()>;
    // Cherry-pick
    async fn cherry_pick(&self, options: &CherryPickOptions) -> AppResult<CherryPickResult>;
    async fn cherry_pick_abort(&self, worktree_path: &str) -> AppResult<()>;
    // Conflict
    async fn conflict_list(&self, worktree_path: &str) -> AppResult<Vec<ConflictFile>>;
    async fn conflict_file_content(&self, worktree_path: &str, file_path: &str) -> AppResult<ThreeWayContent>;
    async fn conflict_resolve(&self, options: &ConflictResolveOptions) -> AppResult<()>;
    async fn conflict_resolve_all(&self, options: &ConflictResolveAllOptions) -> AppResult<()>;
    async fn conflict_mark_resolved(&self, worktree_path: &str, file_path: &str) -> AppResult<()>;
    // Tag
    async fn tag_list(&self, worktree_path: &str) -> AppResult<Vec<TagInfo>>;
    async fn tag_create(&self, options: &TagCreateOptions) -> AppResult<()>;
    async fn tag_delete(&self, worktree_path: &str, tag_name: &str) -> AppResult<()>;
}
