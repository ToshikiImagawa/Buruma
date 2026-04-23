//! 基本 Git 操作ドメイン型。
//! TypeScript 側 `src/shared/domain/index.ts` の CommitArgs 等と 1:1 対応。

use serde::{Deserialize, Serialize};

// --- コマンド引数型 ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StageArgs {
    pub worktree_path: String,
    pub files: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreePathArgs {
    pub worktree_path: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitArgs {
    pub worktree_path: String,
    pub message: String,
    #[serde(default)]
    pub amend: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PushArgs {
    pub worktree_path: String,
    pub remote: Option<String>,
    pub branch: Option<String>,
    pub set_upstream: Option<bool>,
    #[serde(default)]
    pub force: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullArgs {
    pub worktree_path: String,
    pub remote: Option<String>,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchArgs {
    pub worktree_path: String,
    pub remote: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchCreateArgs {
    pub worktree_path: String,
    pub name: String,
    pub start_point: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchCheckoutArgs {
    pub worktree_path: String,
    pub branch: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BranchDeleteArgs {
    pub worktree_path: String,
    pub branch: String,
    #[serde(default)]
    pub remote: Option<bool>,
    #[serde(default)]
    pub force: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetArgs {
    pub worktree_path: String,
    pub mode: ResetMode,
    pub target: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ResetMode {
    Soft,
    Mixed,
    Hard,
}

impl ResetMode {
    pub fn as_flag(&self) -> &str {
        match self {
            Self::Soft => "--soft",
            Self::Mixed => "--mixed",
            Self::Hard => "--hard",
        }
    }
}

// --- 戻り値型 ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitResult {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PushResult {
    pub remote: String,
    pub branch: String,
    pub success: bool,
    pub up_to_date: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PullResult {
    pub remote: String,
    pub branch: String,
    pub summary: PullSummary,
    pub conflicts: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PullSummary {
    pub changes: u32,
    pub insertions: u32,
    pub deletions: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchResult {
    pub remote: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reset_mode_as_flag() {
        assert_eq!(ResetMode::Soft.as_flag(), "--soft");
        assert_eq!(ResetMode::Mixed.as_flag(), "--mixed");
        assert_eq!(ResetMode::Hard.as_flag(), "--hard");
    }
}
