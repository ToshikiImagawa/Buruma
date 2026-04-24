//! ClaudeRepository trait — Claude Code CLI 操作の抽象。

use async_trait::async_trait;

use crate::error::AppResult;
use crate::features::claude_code_integration::domain::{
    ClaudeAuthStatus, ClaudeCommand, ClaudeOutput, ClaudeSession, ConflictResolveRequest, DiffReviewArgs,
    GenerateCommitMessageArgs,
};

#[async_trait]
pub trait ClaudeRepository: Send + Sync {
    // Session
    async fn start_session(&self, worktree_path: &str, app_handle: tauri::AppHandle) -> AppResult<ClaudeSession>;
    async fn stop_session(&self, session_id: &str, app_handle: tauri::AppHandle) -> AppResult<()>;
    async fn get_session(&self, session_id: &str) -> AppResult<Option<ClaudeSession>>;
    async fn get_all_sessions(&self) -> AppResult<Vec<ClaudeSession>>;
    // Command / Output
    async fn send_command(&self, command: &ClaudeCommand, app_handle: tauri::AppHandle) -> AppResult<()>;
    async fn get_output(&self, session_id: &str) -> AppResult<Vec<ClaudeOutput>>;
    // Auth
    async fn check_auth(&self) -> AppResult<ClaudeAuthStatus>;
    async fn login(&self) -> AppResult<()>;
    async fn logout(&self) -> AppResult<()>;
    // AI Operations
    async fn generate_commit_message(&self, args: &GenerateCommitMessageArgs) -> AppResult<String>;
    async fn review_diff(&self, args: &DiffReviewArgs, app_handle: tauri::AppHandle) -> AppResult<()>;
    async fn explain_diff(&self, args: &DiffReviewArgs, app_handle: tauri::AppHandle) -> AppResult<()>;
    // AI Conflict Resolution
    async fn resolve_conflict(&self, args: &ConflictResolveRequest, app_handle: tauri::AppHandle) -> AppResult<()>;
}
