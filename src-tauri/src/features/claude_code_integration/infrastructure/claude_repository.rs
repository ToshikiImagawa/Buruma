//! DefaultClaudeRepository — ClaudeSessionManager + ワンショット CLI コマンド。

use async_trait::async_trait;
use tauri::Emitter;

use crate::error::{AppError, AppResult};
use crate::features::claude_code_integration::application::repositories::ClaudeRepository;
use crate::features::claude_code_integration::domain::{
    ClaudeAuthStatus, ClaudeCommand, ClaudeOutput, ClaudeSession, ConflictResolveRequest, ConflictResolveResult,
    DiffReviewArgs, GenerateCommitMessageArgs,
};
use crate::features::claude_code_integration::infrastructure::output_parser;
use crate::features::claude_code_integration::infrastructure::prompts::{
    commit_message::build_commit_message_prompt, conflict_resolve::build_conflict_resolve_prompt,
    explain::build_explain_diff_prompt, review::build_review_diff_prompt,
};
use crate::features::claude_code_integration::infrastructure::session_manager::ClaudeSessionManager;

pub struct DefaultClaudeRepository {
    pub manager: ClaudeSessionManager,
}

impl DefaultClaudeRepository {
    pub fn new() -> Self {
        Self {
            manager: ClaudeSessionManager::new(),
        }
    }
}

#[async_trait]
impl ClaudeRepository for DefaultClaudeRepository {
    async fn start_session(
        &self,
        worktree_path: &str,
        session_id: Option<&str>,
        claude_session_id: Option<&str>,
        app_handle: tauri::AppHandle,
    ) -> AppResult<ClaudeSession> {
        self.manager
            .start_session(worktree_path, session_id, claude_session_id, app_handle)
            .await
    }

    async fn stop_session(&self, session_id: &str, app_handle: tauri::AppHandle) -> AppResult<()> {
        self.manager.stop_session(session_id, app_handle).await
    }

    async fn get_session(&self, session_id: &str) -> AppResult<Option<ClaudeSession>> {
        Ok(self.manager.get_session(session_id))
    }

    async fn get_all_sessions(&self) -> AppResult<Vec<ClaudeSession>> {
        Ok(self.manager.get_all_sessions())
    }

    async fn send_command(&self, command: &ClaudeCommand, app_handle: tauri::AppHandle) -> AppResult<()> {
        let session_id = command
            .session_id
            .as_deref()
            .ok_or_else(|| AppError::Claude("session_id is required for send_command".to_string()))?;
        self.manager
            .send_command(session_id, &command.input, command.model.as_deref(), app_handle)
            .await
    }

    async fn get_output(&self, session_id: &str) -> AppResult<Vec<ClaudeOutput>> {
        Ok(self.manager.get_output(session_id))
    }

    async fn check_auth(&self) -> AppResult<ClaudeAuthStatus> {
        let output = tokio::process::Command::new("claude")
            .args(["auth", "status"])
            .output()
            .await
            .map_err(|e| AppError::Claude(format!("Failed to run claude auth status: {e}")))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(output_parser::parse_auth_status(output.status.success(), &stdout))
    }

    async fn login(&self) -> AppResult<()> {
        // GUI 環境での対話的ログインは制限がある。
        // spawn + wait 方式で TTY 検出の可能性を高め、タイムアウトで保護する。
        let mut child = tokio::process::Command::new("claude")
            .args(["auth", "login"])
            .stdin(std::process::Stdio::inherit())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| AppError::Claude(format!("claude auth login の起動に失敗しました: {e}")))?;

        let timeout_result = tokio::time::timeout(std::time::Duration::from_secs(120), child.wait()).await;

        match timeout_result {
            Ok(Ok(status)) if status.success() => Ok(()),
            Ok(Ok(_)) => Err(AppError::Claude(
                "GUI 環境での自動ログインに失敗しました。\
                 ターミナルで 'claude auth login' を実行してからアプリを再起動してください。"
                    .to_string(),
            )),
            Ok(Err(e)) => Err(AppError::Claude(format!("ログインプロセスエラー: {e}"))),
            Err(_) => {
                let _ = child.kill().await;
                Err(AppError::Claude(
                    "ログインがタイムアウトしました。\
                     ターミナルで 'claude auth login' を実行してください。"
                        .to_string(),
                ))
            }
        }
    }

    async fn logout(&self) -> AppResult<()> {
        let output = tokio::process::Command::new("claude")
            .args(["auth", "logout"])
            .output()
            .await
            .map_err(|e| AppError::Claude(format!("Failed to run claude auth logout: {e}")))?;

        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(AppError::Claude(stderr.trim().to_string()))
        }
    }

    async fn generate_commit_message(&self, args: &GenerateCommitMessageArgs) -> AppResult<String> {
        let prompt = build_commit_message_prompt(args);

        let output = tokio::process::Command::new("claude")
            .args(["-p", &prompt])
            .current_dir(&args.worktree_path)
            .output()
            .await
            .map_err(|e| AppError::Claude(format!("Failed to run claude for commit message: {e}")))?;

        if output.status.success() {
            Ok(output_parser::parse_commit_message(&String::from_utf8_lossy(
                &output.stdout,
            )))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(AppError::Claude(format!(
                "Commit message generation failed: {}",
                stderr.trim()
            )))
        }
    }

    async fn review_diff(&self, args: &DiffReviewArgs, app_handle: tauri::AppHandle) -> AppResult<()> {
        let worktree_path = args.worktree_path.clone();
        let diff_text = args.diff_text.clone();

        tokio::spawn(async move {
            let prompt = build_review_diff_prompt(&diff_text);

            let output = tokio::process::Command::new("claude")
                .args(["-p", &prompt])
                .current_dir(&worktree_path)
                .output()
                .await;

            let result = match output {
                Ok(out) => {
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    output_parser::build_review_result(&worktree_path, out.status.success(), &stdout)
                }
                Err(_) => output_parser::build_review_result(&worktree_path, false, ""),
            };

            let _ = app_handle.emit("claude-review-result", &result);
        });

        Ok(())
    }

    async fn explain_diff(&self, args: &DiffReviewArgs, app_handle: tauri::AppHandle) -> AppResult<()> {
        let worktree_path = args.worktree_path.clone();
        let diff_text = args.diff_text.clone();

        tokio::spawn(async move {
            let prompt = build_explain_diff_prompt(&diff_text);

            let output = tokio::process::Command::new("claude")
                .args(["-p", &prompt])
                .current_dir(&worktree_path)
                .output()
                .await;

            let result = match output {
                Ok(out) => {
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    output_parser::build_explain_result(&worktree_path, out.status.success(), &stdout)
                }
                Err(_) => output_parser::build_explain_result(&worktree_path, false, ""),
            };

            let _ = app_handle.emit("claude-explain-result", &result);
        });

        Ok(())
    }

    async fn resolve_conflict(&self, args: &ConflictResolveRequest, app_handle: tauri::AppHandle) -> AppResult<()> {
        let worktree_path = args.worktree_path.clone();
        let file_path = args.file_path.clone();
        let three_way = args.three_way_content.clone();

        tokio::spawn(async move {
            let prompt = build_conflict_resolve_prompt(&file_path, &three_way);

            let output = tokio::process::Command::new("claude")
                .args(["-p", &prompt])
                .current_dir(&worktree_path)
                .output()
                .await;

            let result = match output {
                Ok(out) => {
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    output_parser::build_conflict_resolve_result(
                        &worktree_path,
                        &file_path,
                        out.status.success(),
                        &stdout,
                        &stderr,
                    )
                }
                Err(e) => ConflictResolveResult::Failed {
                    worktree_path: worktree_path.clone(),
                    file_path: file_path.clone(),
                    error: format!("Failed to run claude: {e}"),
                },
            };

            let _ = app_handle.emit("claude-conflict-resolved", &result);
        });

        Ok(())
    }
}

impl Default for DefaultClaudeRepository {
    fn default() -> Self {
        Self::new()
    }
}
