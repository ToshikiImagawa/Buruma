//! 高度な Git 操作ドメイン型。
//! TypeScript 側 `src/shared/domain/index.ts` の MergeOptions 等と 1:1 対応。

use serde::{Deserialize, Serialize};

// --- 共通引数型 ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreePathArgs {
    pub worktree_path: String,
}

// --- Merge ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MergeOptions {
    pub worktree_path: String,
    pub branch: String,
    pub strategy: MergeStrategy,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MergeStrategy {
    FastForward,
    NoFf,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergeResult {
    pub status: MergeResultStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_files: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub merge_commit: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum MergeResultStatus {
    Success,
    Conflict,
    AlreadyUpToDate,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergeStatus {
    pub is_merging: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub branch: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_files: Option<Vec<String>>,
}

// --- Rebase ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RebaseOptions {
    pub worktree_path: String,
    /// 乗せ替え先（newbase）。`git rebase --onto <onto>` の onto。
    pub onto: String,
    /// 再適用コミット範囲の起点。指定時は `git rebase --onto <onto> <upstream>`。
    /// 未指定時は `git rebase <onto>`（upstream = onto と同等）。
    #[serde(default)]
    pub upstream: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InteractiveRebaseOptions {
    pub worktree_path: String,
    pub onto: String,
    #[serde(default)]
    pub upstream: Option<String>,
    pub steps: Vec<RebaseStep>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RebaseStep {
    pub hash: String,
    pub message: String,
    pub action: RebaseAction,
    pub order: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RebaseAction {
    Pick,
    Reword,
    Edit,
    Squash,
    Fixup,
    Drop,
}

impl RebaseAction {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Pick => "pick",
            Self::Reword => "reword",
            Self::Edit => "edit",
            Self::Squash => "squash",
            Self::Fixup => "fixup",
            Self::Drop => "drop",
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RebaseResult {
    pub status: RebaseResultStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_files: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_step: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_steps: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RebaseResultStatus {
    Success,
    Conflict,
    Aborted,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RebaseGetCommitsArgs {
    pub worktree_path: String,
    pub onto: String,
    #[serde(default)]
    pub upstream: Option<String>,
}

// --- Stash ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StashSaveOptions {
    pub worktree_path: String,
    #[serde(default)]
    pub message: Option<String>,
    #[serde(default)]
    pub include_untracked: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StashEntry {
    pub index: u32,
    pub message: String,
    pub date: String,
    pub branch: String,
    pub hash: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StashIndexArgs {
    pub worktree_path: String,
    pub index: u32,
}

// --- Cherry-pick ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CherryPickOptions {
    pub worktree_path: String,
    pub commits: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CherryPickResult {
    pub status: CherryPickResultStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict_files: Option<Vec<String>>,
    pub applied_commits: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CherryPickResultStatus {
    Success,
    Conflict,
}

// --- Conflict ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictFile {
    pub file_path: String,
    pub status: ConflictFileStatus,
    pub conflict_type: ConflictType,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConflictFileStatus {
    Conflicted,
    Resolved,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConflictType {
    Content,
    Rename,
    Delete,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictFileArgs {
    pub worktree_path: String,
    pub file_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreeWayContent {
    pub base: String,
    pub ours: String,
    pub theirs: String,
    pub merged: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictResolveOptions {
    pub worktree_path: String,
    pub file_path: String,
    pub resolution: ConflictResolution,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ConflictResolution {
    Ours,
    Theirs,
    Manual { content: String },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictResolveAllOptions {
    pub worktree_path: String,
    pub strategy: ConflictResolveAllStrategy,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConflictResolveAllStrategy {
    Ours,
    Theirs,
}

// --- Tag ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagInfo {
    pub name: String,
    pub hash: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    pub date: String,
    #[serde(rename = "type")]
    pub tag_type: TagType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tagger: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TagType {
    Lightweight,
    Annotated,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagCreateOptions {
    pub worktree_path: String,
    pub tag_name: String,
    #[serde(default)]
    pub commit_hash: Option<String>,
    #[serde(rename = "type")]
    pub tag_type: TagType,
    #[serde(default)]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagDeleteArgs {
    pub worktree_path: String,
    pub tag_name: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rebase_action_as_str() {
        assert_eq!(RebaseAction::Pick.as_str(), "pick");
        assert_eq!(RebaseAction::Reword.as_str(), "reword");
        assert_eq!(RebaseAction::Edit.as_str(), "edit");
        assert_eq!(RebaseAction::Squash.as_str(), "squash");
        assert_eq!(RebaseAction::Fixup.as_str(), "fixup");
        assert_eq!(RebaseAction::Drop.as_str(), "drop");
    }
}
