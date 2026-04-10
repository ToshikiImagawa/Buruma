//! ClaudeSessionManager — Claude Code CLI セッション管理。
//!
//! `claude` CLI は TTY を要求するため対話モード (stdin パイプ) では動作しない。
//! 代わりに各コマンドを `claude -p "..."` ワンショットで実行し、
//! セッション概念は状態管理のみで提供する。

use std::collections::HashMap;
use std::sync::Mutex;

use tauri::Emitter;

use crate::error::{AppError, AppResult};
use crate::features::claude_code_integration::domain::{
    ClaudeOutput, ClaudeOutputStream, ClaudeSession, CommandCompletedEvent, SessionStatus,
};

pub struct ClaudeSessionManager {
    sessions: Mutex<HashMap<String, SessionState>>,
}

struct SessionState {
    info: ClaudeSession,
    outputs: Vec<ClaudeOutput>,
}

impl ClaudeSessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    /// セッション開始。`claude` CLI の存在確認のみ行い、状態を Running に設定。
    /// 実際のプロセスはコマンド送信時にワンショットで起動する。
    pub async fn start_session(
        &self,
        worktree_path: &str,
        app_handle: tauri::AppHandle,
    ) -> AppResult<ClaudeSession> {
        // 既存 Running セッションがあれば返す
        {
            let sessions = self.sessions.lock().unwrap();
            if let Some(s) = sessions.get(worktree_path) {
                if s.info.status == SessionStatus::Running {
                    return Ok(s.info.clone());
                }
            }
        }

        // claude CLI の存在確認
        let check = tokio::process::Command::new("claude")
            .arg("--version")
            .output()
            .await;

        if check.is_err() || !check.as_ref().unwrap().status.success() {
            return Err(AppError::Claude(
                "Claude Code CLI が見つかりません。`claude` コマンドをインストールしてください。"
                    .to_string(),
            ));
        }

        let now = chrono::Utc::now().to_rfc3339();
        let session = ClaudeSession {
            worktree_path: worktree_path.to_string(),
            status: SessionStatus::Running,
            pid: None,
            started_at: Some(now),
            error: None,
        };

        {
            let mut sessions = self.sessions.lock().unwrap();
            sessions.insert(
                worktree_path.to_string(),
                SessionState {
                    info: session.clone(),
                    outputs: Vec::new(),
                },
            );
        }

        let _ = app_handle.emit("claude-session-changed", &session);
        Ok(session)
    }

    /// セッション停止。状態を Idle に変更。
    pub async fn stop_session(
        &self,
        worktree_path: &str,
        app_handle: tauri::AppHandle,
    ) -> AppResult<()> {
        {
            let mut sessions = self.sessions.lock().unwrap();
            if let Some(s) = sessions.get_mut(worktree_path) {
                s.info.status = SessionStatus::Idle;
                s.info.pid = None;
            } else {
                return Err(AppError::NotFound(format!(
                    "No session for {worktree_path}"
                )));
            }
        }

        if let Some(session) = self.get_session(worktree_path) {
            let _ = app_handle.emit("claude-session-changed", &session);
        }
        Ok(())
    }

    pub fn get_session(&self, worktree_path: &str) -> Option<ClaudeSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.get(worktree_path).map(|s| s.info.clone())
    }

    pub fn get_all_sessions(&self) -> Vec<ClaudeSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.values().map(|s| s.info.clone()).collect()
    }

    /// コマンド送信: `claude -p "input"` ワンショット実行。
    /// 出力を蓄積し、claude-output / claude-command-completed イベントを発信。
    pub async fn send_command(
        &self,
        worktree_path: &str,
        input: &str,
        app_handle: tauri::AppHandle,
    ) -> AppResult<()> {
        // セッションが Running であることを確認
        {
            let sessions = self.sessions.lock().unwrap();
            let s = sessions
                .get(worktree_path)
                .ok_or_else(|| AppError::NotFound(format!("No session for {worktree_path}")))?;
            if s.info.status != SessionStatus::Running {
                return Err(AppError::Claude("Session is not running".to_string()));
            }
        }

        let output = tokio::process::Command::new("claude")
            .args(["-p", input])
            .current_dir(worktree_path)
            .output()
            .await
            .map_err(|e| AppError::Claude(format!("Failed to run claude: {e}")))?;

        let now = chrono::Utc::now().to_rfc3339();

        // stdout
        let stdout_text = String::from_utf8_lossy(&output.stdout).to_string();
        if !stdout_text.is_empty() {
            let out = ClaudeOutput {
                worktree_path: worktree_path.to_string(),
                stream: ClaudeOutputStream::Stdout,
                content: stdout_text,
                timestamp: now.clone(),
            };
            let _ = app_handle.emit("claude-output", &out);
            self.append_output(worktree_path, out);
        }

        // stderr
        let stderr_text = String::from_utf8_lossy(&output.stderr).to_string();
        if !stderr_text.is_empty() {
            let out = ClaudeOutput {
                worktree_path: worktree_path.to_string(),
                stream: ClaudeOutputStream::Stderr,
                content: stderr_text,
                timestamp: now,
            };
            let _ = app_handle.emit("claude-output", &out);
            self.append_output(worktree_path, out);
        }

        let _ = app_handle.emit(
            "claude-command-completed",
            CommandCompletedEvent {
                worktree_path: worktree_path.to_string(),
            },
        );

        if !output.status.success() {
            return Err(AppError::Claude("Claude command failed".to_string()));
        }

        Ok(())
    }

    pub fn get_output(&self, worktree_path: &str) -> Vec<ClaudeOutput> {
        let sessions = self.sessions.lock().unwrap();
        sessions
            .get(worktree_path)
            .map(|s| s.outputs.clone())
            .unwrap_or_default()
    }

    fn append_output(&self, worktree_path: &str, output: ClaudeOutput) {
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(s) = sessions.get_mut(worktree_path) {
            if s.outputs.len() >= 1000 {
                s.outputs.remove(0);
            }
            s.outputs.push(output);
        }
    }
}

impl Default for ClaudeSessionManager {
    fn default() -> Self {
        Self::new()
    }
}
