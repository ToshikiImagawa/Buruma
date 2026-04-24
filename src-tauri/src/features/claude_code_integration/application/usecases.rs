//! claude-code-integration UseCase 関数。

use crate::error::AppResult;
use crate::features::claude_code_integration::application::repositories::{
    ClaudeRepository, ConversationStoreRepository,
};
use crate::features::claude_code_integration::domain::{
    ClaudeAuthStatus, ClaudeCommand, ClaudeOutput, ClaudeSession, ConflictResolveRequest, DiffReviewArgs,
    GenerateCommitMessageArgs, PersistedConversation,
};

pub async fn start_session(
    repo: &dyn ClaudeRepository,
    worktree_path: &str,
    session_id: Option<&str>,
    claude_session_id: Option<&str>,
    app: tauri::AppHandle,
) -> AppResult<ClaudeSession> {
    repo.start_session(worktree_path, session_id, claude_session_id, app)
        .await
}

pub async fn stop_session(repo: &dyn ClaudeRepository, session_id: &str, app: tauri::AppHandle) -> AppResult<()> {
    repo.stop_session(session_id, app).await
}

pub async fn get_session(repo: &dyn ClaudeRepository, session_id: &str) -> AppResult<Option<ClaudeSession>> {
    repo.get_session(session_id).await
}

pub async fn get_all_sessions(repo: &dyn ClaudeRepository) -> AppResult<Vec<ClaudeSession>> {
    repo.get_all_sessions().await
}

pub async fn send_command(
    repo: &dyn ClaudeRepository,
    command: &ClaudeCommand,
    app: tauri::AppHandle,
) -> AppResult<()> {
    repo.send_command(command, app).await
}

pub async fn get_output(repo: &dyn ClaudeRepository, session_id: &str) -> AppResult<Vec<ClaudeOutput>> {
    repo.get_output(session_id).await
}

pub async fn check_auth(repo: &dyn ClaudeRepository) -> AppResult<ClaudeAuthStatus> {
    repo.check_auth().await
}

pub async fn login(repo: &dyn ClaudeRepository) -> AppResult<()> {
    repo.login().await
}

pub async fn logout(repo: &dyn ClaudeRepository) -> AppResult<()> {
    repo.logout().await
}

pub async fn generate_commit_message(
    repo: &dyn ClaudeRepository,
    args: &GenerateCommitMessageArgs,
) -> AppResult<String> {
    repo.generate_commit_message(args).await
}

pub async fn review_diff(repo: &dyn ClaudeRepository, args: &DiffReviewArgs, app: tauri::AppHandle) -> AppResult<()> {
    repo.review_diff(args, app).await
}

pub async fn explain_diff(repo: &dyn ClaudeRepository, args: &DiffReviewArgs, app: tauri::AppHandle) -> AppResult<()> {
    repo.explain_diff(args, app).await
}

pub async fn resolve_conflict(
    repo: &dyn ClaudeRepository,
    args: &ConflictResolveRequest,
    app: tauri::AppHandle,
) -> AppResult<()> {
    repo.resolve_conflict(args, app).await
}

// --- 会話永続化 ---

pub fn get_conversations(store: &dyn ConversationStoreRepository) -> AppResult<Vec<PersistedConversation>> {
    store.get_conversations()
}

pub fn save_conversations(
    store: &dyn ConversationStoreRepository,
    conversations: &[PersistedConversation],
) -> AppResult<()> {
    store.set_conversations(conversations)
}
