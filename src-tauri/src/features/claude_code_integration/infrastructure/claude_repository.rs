//! DefaultClaudeRepository — ClaudeSessionManager + ワンショット CLI コマンド。

use async_trait::async_trait;
use tauri::Emitter;

use crate::error::{AppError, AppResult};
use crate::features::claude_code_integration::application::repositories::ClaudeRepository;
use crate::features::claude_code_integration::domain::{
    ClaudeAuthStatus, ClaudeCommand, ClaudeOutput, ClaudeSession, ConflictResolveRequest, ConflictResolveResult,
    DiffReviewArgs, ExplainResult, GenerateCommitMessageArgs, ReviewComment, ReviewResult, ReviewSeverity,
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
    async fn start_session(&self, worktree_path: &str, app_handle: tauri::AppHandle) -> AppResult<ClaudeSession> {
        self.manager.start_session(worktree_path, app_handle).await
    }

    async fn stop_session(&self, worktree_path: &str, app_handle: tauri::AppHandle) -> AppResult<()> {
        self.manager.stop_session(worktree_path, app_handle).await
    }

    async fn get_session(&self, worktree_path: &str) -> AppResult<Option<ClaudeSession>> {
        Ok(self.manager.get_session(worktree_path))
    }

    async fn get_all_sessions(&self) -> AppResult<Vec<ClaudeSession>> {
        Ok(self.manager.get_all_sessions())
    }

    async fn send_command(&self, command: &ClaudeCommand, app_handle: tauri::AppHandle) -> AppResult<()> {
        self.manager
            .send_command(&command.worktree_path, &command.input, app_handle)
            .await
    }

    async fn get_output(&self, worktree_path: &str) -> AppResult<Vec<ClaudeOutput>> {
        Ok(self.manager.get_output(worktree_path))
    }

    async fn check_auth(&self) -> AppResult<ClaudeAuthStatus> {
        let output = tokio::process::Command::new("claude")
            .args(["auth", "status"])
            .output()
            .await
            .map_err(|e| AppError::Claude(format!("Failed to run claude auth status: {e}")))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();

        // `claude auth status` は JSON を出力: { "loggedIn": true, "email": "...", ... }
        if output.status.success() {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                let logged_in = json.get("loggedIn").and_then(|v| v.as_bool()).unwrap_or(false);
                let email = json.get("email").and_then(|v| v.as_str()).map(|s| s.to_string());
                Ok(ClaudeAuthStatus {
                    authenticated: logged_in,
                    account_email: email,
                })
            } else {
                // JSON パース失敗時はテキストフォールバック
                Ok(ClaudeAuthStatus {
                    authenticated: stdout.contains("loggedIn")
                        || stdout.contains("Logged in")
                        || stdout.contains("authenticated"),
                    account_email: None,
                })
            }
        } else {
            Ok(ClaudeAuthStatus {
                authenticated: false,
                account_email: None,
            })
        }
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
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
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
            let prompt = format!(
                "Review the following code diff. For each issue found, provide:\n\
                 - file path\n- line numbers\n- severity (info/warning/error)\n\
                 - description\n- suggestion (if applicable)\n\n\
                 Also provide a brief summary.\n\n{}",
                diff_text
            );

            let output = tokio::process::Command::new("claude")
                .args(["-p", &prompt])
                .current_dir(&worktree_path)
                .output()
                .await;

            let result = match output {
                Ok(out) if out.status.success() => {
                    let text = String::from_utf8_lossy(&out.stdout).to_string();
                    ReviewResult {
                        worktree_path: worktree_path.clone(),
                        comments: vec![ReviewComment {
                            id: uuid::Uuid::new_v4().to_string(),
                            file_path: String::new(),
                            line_start: 0,
                            line_end: 0,
                            severity: ReviewSeverity::Info,
                            message: text.clone(),
                            suggestion: None,
                        }],
                        summary: text,
                    }
                }
                _ => ReviewResult {
                    worktree_path: worktree_path.clone(),
                    comments: Vec::new(),
                    summary: "Review failed".to_string(),
                },
            };

            let _ = app_handle.emit("claude-review-result", &result);
        });

        Ok(())
    }

    async fn explain_diff(&self, args: &DiffReviewArgs, app_handle: tauri::AppHandle) -> AppResult<()> {
        let worktree_path = args.worktree_path.clone();
        let diff_text = args.diff_text.clone();

        tokio::spawn(async move {
            let prompt = format!(
                "Explain the following code diff in detail. \
                 Describe what changes were made and why they might have been made:\n\n{}",
                diff_text
            );

            let output = tokio::process::Command::new("claude")
                .args(["-p", &prompt])
                .current_dir(&worktree_path)
                .output()
                .await;

            let result = match output {
                Ok(out) if out.status.success() => ExplainResult {
                    worktree_path: worktree_path.clone(),
                    explanation: String::from_utf8_lossy(&out.stdout).trim().to_string(),
                },
                _ => ExplainResult {
                    worktree_path: worktree_path.clone(),
                    explanation: "Explanation failed".to_string(),
                },
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
            let prompt = format!(
                "You are resolving a git merge conflict for the file: {file_path}\n\n\
                 Below are the three versions of the file.\n\n\
                 === BASE (common ancestor) ===\n{base}\n\n\
                 === OURS (current branch) ===\n{ours}\n\n\
                 === THEIRS (incoming branch) ===\n{theirs}\n\n\
                 Merge these three versions into a single resolved file that preserves \
                 the intent of both OURS and THEIRS changes relative to BASE.\n\n\
                 IMPORTANT: Reply with ONLY the merged file content. \
                 Do NOT include any explanation, markdown fences, or extra text.",
                file_path = file_path,
                base = three_way.base,
                ours = three_way.ours,
                theirs = three_way.theirs,
            );

            let output = tokio::process::Command::new("claude")
                .args(["-p", &prompt])
                .current_dir(&worktree_path)
                .output()
                .await;

            let result = match output {
                Ok(out) if out.status.success() => ConflictResolveResult::Resolved {
                    worktree_path: worktree_path.clone(),
                    file_path: file_path.clone(),
                    merged_content: String::from_utf8_lossy(&out.stdout).trim().to_string(),
                },
                Ok(out) => {
                    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
                    ConflictResolveResult::Failed {
                        worktree_path: worktree_path.clone(),
                        file_path: file_path.clone(),
                        error: if stderr.is_empty() {
                            "Conflict resolution failed".to_string()
                        } else {
                            stderr
                        },
                    }
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

/// コミットメッセージ生成プロンプトを構築する。
/// `AppSettings.commitMessageRules` が指定されている場合はデフォルト指示に追記する。
fn build_commit_message_prompt(args: &GenerateCommitMessageArgs) -> String {
    let mut prompt = String::from(
        "Generate a concise git commit message for the following diff. \
         Reply with ONLY the commit message, no explanation.",
    );

    if let Some(rules) = args.rules.as_deref() {
        let trimmed = rules.trim();
        if !trimmed.is_empty() {
            prompt.push_str("\n\nAdditional rules (provided by the user — follow them strictly):\n");
            prompt.push_str(trimmed);
        }
    }

    prompt.push_str("\n\nDiff:\n");
    prompt.push_str(&args.diff_text);
    prompt
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_args(rules: Option<&str>) -> GenerateCommitMessageArgs {
        GenerateCommitMessageArgs {
            worktree_path: "/tmp/repo".to_string(),
            diff_text: "--- a/x.rs\n+++ b/x.rs\n@@\n-1\n+2\n".to_string(),
            rules: rules.map(|s| s.to_string()),
        }
    }

    #[test]
    fn build_prompt_without_rules_uses_default_only() {
        let prompt = build_commit_message_prompt(&make_args(None));

        assert!(prompt.contains("Generate a concise git commit message"));
        assert!(prompt.contains("Reply with ONLY the commit message"));
        assert!(!prompt.contains("Additional rules"));
        assert!(prompt.contains("Diff:\n--- a/x.rs"));
    }

    #[test]
    fn build_prompt_with_rules_appends_user_rules_before_diff() {
        let prompt = build_commit_message_prompt(&make_args(Some("- Use Conventional Commits\n- Write in Japanese")));

        assert!(prompt.contains("Additional rules"));
        assert!(prompt.contains("- Use Conventional Commits"));
        assert!(prompt.contains("- Write in Japanese"));

        // ルール → Diff の順である（ルールが diff に混ざらないことを保証）。
        let rules_idx = prompt.find("Conventional Commits").expect("rules present");
        let diff_idx = prompt.find("Diff:").expect("diff marker present");
        assert!(rules_idx < diff_idx);
    }

    #[test]
    fn build_prompt_with_blank_rules_is_treated_as_none() {
        let prompt = build_commit_message_prompt(&make_args(Some("   \n  ")));

        assert!(!prompt.contains("Additional rules"));
    }
}
