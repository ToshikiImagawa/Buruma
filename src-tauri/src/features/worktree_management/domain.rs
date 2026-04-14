//! ワークツリー管理ドメイン型。
//! TypeScript 側 `src/shared/domain/index.ts` の WorktreeInfo 等と 1:1 対応。

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeInfo {
    pub path: String,
    pub branch: Option<String>,
    pub head: String,
    pub head_message: String,
    pub is_main: bool,
    pub is_dirty: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeStatus {
    pub worktree: WorktreeInfo,
    pub staged: Vec<FileChange>,
    pub unstaged: Vec<FileChange>,
    pub untracked: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChange {
    pub path: String,
    pub status: FileChangeStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub old_path: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FileChangeStatus {
    Added,
    Modified,
    Deleted,
    Renamed,
    Copied,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeCreateParams {
    pub repo_path: String,
    pub worktree_path: String,
    pub branch: String,
    pub create_new_branch: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_point: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeDeleteParams {
    pub repo_path: String,
    pub worktree_path: String,
    pub force: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeChangeEvent {
    pub repo_path: String,
    #[serde(rename = "type")]
    pub change_type: String,
    pub worktree_path: String,
}

// --- FR_106: シンボリックリンク ---

/// ワークツリー作成結果（worktree + symlink 結果）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeCreateResult {
    pub worktree: WorktreeInfo,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub symlink: Option<SymlinkResult>,
}

/// シンボリックリンク設定ソース
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SymlinkConfigSource {
    App,
    Repo,
}

/// シンボリックリンク設定
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymlinkConfig {
    pub patterns: Vec<String>,
    pub source: SymlinkConfigSource,
}

/// シンボリックリンク設定保存パラメータ（IPC 用）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymlinkConfigSetParams {
    pub repo_path: String,
    pub config: SymlinkConfig,
}

/// シンボリックリンク作成結果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymlinkResult {
    pub entries: Vec<SymlinkResultEntry>,
    pub total_created: u32,
    pub total_skipped: u32,
    pub total_failed: u32,
}

/// シンボリックリンク処理ステータス
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SymlinkStatus {
    Created,
    Skipped,
    Partial,
    Failed,
}

/// パターン単位のシンボリックリンク結果エントリ
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymlinkResultEntry {
    pub pattern: String,
    pub status: SymlinkStatus,
    pub matched: u32,
    pub created: u32,
    pub failed: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}
