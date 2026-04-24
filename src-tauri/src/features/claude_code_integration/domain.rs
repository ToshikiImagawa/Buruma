//! Claude Code 連携ドメイン型。
//! TypeScript 側 `src/shared/domain/index.ts` の ClaudeSession 等と 1:1 対応。

use serde::{Deserialize, Serialize};

// --- セッション ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeSession {
    pub id: String,
    pub worktree_path: String,
    pub status: SessionStatus,
    pub pid: Option<u32>,
    pub started_at: Option<String>,
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub claude_session_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SessionStatus {
    Idle,
    Starting,
    Running,
    Stopping,
    Error,
}

// --- 認証 ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeAuthStatus {
    pub authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub account_email: Option<String>,
}

// --- コマンド / 出力 ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeCommand {
    pub worktree_path: String,
    #[serde(rename = "type")]
    pub command_type: ClaudeCommandType,
    pub input: String,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ClaudeCommandType {
    General,
    GitDelegation,
    Review,
    Explain,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeOutput {
    pub worktree_path: String,
    pub stream: ClaudeOutputStream,
    pub content: String,
    pub timestamp: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ClaudeOutputStream {
    Stdout,
    Stderr,
}

// --- Diff 対象 ---

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum DiffTarget {
    Working { staged: bool },
    Commits { from: String, to: String },
    Branches { from: String, to: String },
}

// --- レビュー ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewResult {
    pub worktree_path: String,
    pub comments: Vec<ReviewComment>,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewComment {
    pub id: String,
    pub file_path: String,
    pub line_start: u32,
    pub line_end: u32,
    pub severity: ReviewSeverity,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ReviewSeverity {
    Info,
    Warning,
    Error,
}

// --- 解説 ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExplainResult {
    pub worktree_path: String,
    pub explanation: String,
}

// --- 永続化用会話データ ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedConversation {
    pub id: String,
    pub worktree_path: String,
    pub title: String,
    pub messages: Vec<PersistedChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub claude_session_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedChatMessage {
    pub id: String,
    pub role: ChatMessageRole,
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ChatMessageRole {
    User,
    Assistant,
}

// --- コマンド引数型 ---

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartSessionArgs {
    pub worktree_path: String,
    #[serde(default)]
    pub session_id: Option<String>,
    #[serde(default)]
    pub claude_session_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorktreePathArgs {
    pub worktree_path: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionIdArgs {
    pub session_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateCommitMessageArgs {
    pub worktree_path: String,
    pub diff_text: String,
    /// AppSettings.commitMessageRules を反映するカスタムルール。
    /// None / 空文字列の場合はデフォルトプロンプトのみを使用する。
    #[serde(default)]
    pub rules: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffReviewArgs {
    pub worktree_path: String,
    pub diff_target: DiffTarget,
    pub diff_text: String,
}

// --- AI コンフリクト解決 ---

/// AI コンフリクト解決で使用する 3 ウェイマージ内容。
/// advanced_git_operations 側の ThreeWayContent と同一構造だが、
/// feature 間直接参照禁止 (A-004) に準拠するため独立定義。
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreeWayContent {
    pub base: String,
    pub ours: String,
    pub theirs: String,
    pub merged: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictResolveRequest {
    pub worktree_path: String,
    pub file_path: String,
    pub three_way_content: ThreeWayContent,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum ConflictResolveResult {
    #[serde(rename = "resolved")]
    Resolved {
        worktree_path: String,
        file_path: String,
        merged_content: String,
    },
    #[serde(rename = "failed")]
    Failed {
        worktree_path: String,
        file_path: String,
        error: String,
    },
}

// --- イベント完了通知 ---

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandCompletedEvent {
    pub worktree_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
}
