//! advanced-git-operations UseCase 関数（24 個）。

use crate::error::AppResult;
use crate::features::advanced_git_operations::application::repositories::GitAdvancedRepository;
use crate::features::advanced_git_operations::domain::{
    CherryPickOptions, CherryPickResult, ConflictFile, ConflictResolveAllOptions,
    ConflictResolveOptions, InteractiveRebaseOptions, MergeOptions, MergeResult, MergeStatus,
    RebaseOptions, RebaseResult, RebaseStep, StashEntry, StashSaveOptions, TagCreateOptions,
    TagInfo, ThreeWayContent,
};

// Merge
pub async fn merge(repo: &dyn GitAdvancedRepository, o: &MergeOptions) -> AppResult<MergeResult> {
    repo.merge(o).await
}
pub async fn merge_abort(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<()> {
    repo.merge_abort(p).await
}
pub async fn merge_status(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<MergeStatus> {
    repo.merge_status(p).await
}
// Rebase
pub async fn rebase(
    repo: &dyn GitAdvancedRepository,
    o: &RebaseOptions,
) -> AppResult<RebaseResult> {
    repo.rebase(o).await
}
pub async fn rebase_interactive(
    repo: &dyn GitAdvancedRepository,
    o: &InteractiveRebaseOptions,
) -> AppResult<RebaseResult> {
    repo.rebase_interactive(o).await
}
pub async fn rebase_abort(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<()> {
    repo.rebase_abort(p).await
}
pub async fn rebase_continue(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<RebaseResult> {
    repo.rebase_continue(p).await
}
pub async fn rebase_get_commits(
    repo: &dyn GitAdvancedRepository,
    p: &str,
    onto: &str,
) -> AppResult<Vec<RebaseStep>> {
    repo.rebase_get_commits(p, onto).await
}
// Stash
pub async fn stash_save(repo: &dyn GitAdvancedRepository, o: &StashSaveOptions) -> AppResult<()> {
    repo.stash_save(o).await
}
pub async fn stash_list(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<Vec<StashEntry>> {
    repo.stash_list(p).await
}
pub async fn stash_pop(repo: &dyn GitAdvancedRepository, p: &str, i: u32) -> AppResult<()> {
    repo.stash_pop(p, i).await
}
pub async fn stash_apply(repo: &dyn GitAdvancedRepository, p: &str, i: u32) -> AppResult<()> {
    repo.stash_apply(p, i).await
}
pub async fn stash_drop(repo: &dyn GitAdvancedRepository, p: &str, i: u32) -> AppResult<()> {
    repo.stash_drop(p, i).await
}
pub async fn stash_clear(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<()> {
    repo.stash_clear(p).await
}
// Cherry-pick
pub async fn cherry_pick(
    repo: &dyn GitAdvancedRepository,
    o: &CherryPickOptions,
) -> AppResult<CherryPickResult> {
    repo.cherry_pick(o).await
}
pub async fn cherry_pick_abort(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<()> {
    repo.cherry_pick_abort(p).await
}
// Conflict
pub async fn conflict_list(
    repo: &dyn GitAdvancedRepository,
    p: &str,
) -> AppResult<Vec<ConflictFile>> {
    repo.conflict_list(p).await
}
pub async fn conflict_file_content(
    repo: &dyn GitAdvancedRepository,
    p: &str,
    fp: &str,
) -> AppResult<ThreeWayContent> {
    repo.conflict_file_content(p, fp).await
}
pub async fn conflict_resolve(
    repo: &dyn GitAdvancedRepository,
    o: &ConflictResolveOptions,
) -> AppResult<()> {
    repo.conflict_resolve(o).await
}
pub async fn conflict_resolve_all(
    repo: &dyn GitAdvancedRepository,
    o: &ConflictResolveAllOptions,
) -> AppResult<()> {
    repo.conflict_resolve_all(o).await
}
pub async fn conflict_mark_resolved(
    repo: &dyn GitAdvancedRepository,
    p: &str,
    fp: &str,
) -> AppResult<()> {
    repo.conflict_mark_resolved(p, fp).await
}
// Tag
pub async fn tag_list(repo: &dyn GitAdvancedRepository, p: &str) -> AppResult<Vec<TagInfo>> {
    repo.tag_list(p).await
}
pub async fn tag_create(repo: &dyn GitAdvancedRepository, o: &TagCreateOptions) -> AppResult<()> {
    repo.tag_create(o).await
}
pub async fn tag_delete(repo: &dyn GitAdvancedRepository, p: &str, name: &str) -> AppResult<()> {
    repo.tag_delete(p, name).await
}
