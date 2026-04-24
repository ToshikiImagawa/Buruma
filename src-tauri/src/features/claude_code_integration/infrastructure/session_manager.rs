//! ClaudeSessionManager — Claude Code CLI セッション管理。
//!
//! 会話ごとに独立したセッションを作成し、`claude -p "..."` で実行する。
//! セッションは UUID で識別し、同一 worktree で複数セッションを保持可能。
//! stdout/stderr はストリーミングで行ごとにイベント発信する。

use std::collections::HashMap;
use std::sync::Mutex;

use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::error::{AppError, AppResult};
use crate::features::claude_code_integration::domain::{
    ClaudeOutput, ClaudeOutputStream, ClaudeSession, CommandCompletedEvent, SessionStatus,
};

pub struct ClaudeSessionManager {
    /// セッション ID (UUID) → セッション状態
    sessions: Mutex<HashMap<String, SessionState>>,
}

struct SessionState {
    info: ClaudeSession,
    outputs: Vec<ClaudeOutput>,
    /// 実行中プロセスの abort handle（stop_session で kill するため）
    abort_handle: Option<tokio::task::AbortHandle>,
}

impl ClaudeSessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    /// セッション開始。`claude` CLI の存在確認を行い、新しいセッションを作成。
    /// 各セッションは UUID で識別され、同一 worktree で複数作成可能。
    pub async fn start_session(&self, worktree_path: &str, app_handle: tauri::AppHandle) -> AppResult<ClaudeSession> {
        // claude CLI の存在確認
        let check = Command::new("claude").arg("--version").output().await;

        if check.is_err() || !check.as_ref().unwrap().status.success() {
            return Err(AppError::Claude(
                "Claude Code CLI が見つかりません。`claude` コマンドをインストールしてください。".to_string(),
            ));
        }

        let session_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let session = ClaudeSession {
            id: session_id.clone(),
            worktree_path: worktree_path.to_string(),
            status: SessionStatus::Running,
            pid: None,
            started_at: Some(now),
            error: None,
            claude_session_id: None,
        };

        {
            let mut sessions = self.sessions.lock().unwrap();
            sessions.insert(
                session_id,
                SessionState {
                    info: session.clone(),
                    outputs: Vec::new(),
                    abort_handle: None,
                },
            );
        }

        let _ = app_handle.emit("claude-session-changed", &session);
        Ok(session)
    }

    /// セッション停止。状態を Idle に変更し、実行中プロセスを中断。
    pub async fn stop_session(&self, session_id: &str, app_handle: tauri::AppHandle) -> AppResult<()> {
        {
            let mut sessions = self.sessions.lock().unwrap();
            if let Some(s) = sessions.get_mut(session_id) {
                s.info.status = SessionStatus::Idle;
                s.info.pid = None;
                // 実行中タスクを中断
                if let Some(handle) = s.abort_handle.take() {
                    handle.abort();
                }
            } else {
                return Err(AppError::NotFound(format!("No session for {session_id}")));
            }
        }

        if let Some(session) = self.get_session(session_id) {
            let _ = app_handle.emit("claude-session-changed", &session);
        }
        Ok(())
    }

    pub fn get_session(&self, session_id: &str) -> Option<ClaudeSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.get(session_id).map(|s| s.info.clone())
    }

    pub fn get_all_sessions(&self) -> Vec<ClaudeSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.values().map(|s| s.info.clone()).collect()
    }

    /// コマンド送信: `claude -p "input"` をストリーミング実行。
    /// stdout/stderr を行ごとに読み取り、claude-output イベントを逐次発信。
    pub async fn send_command(
        &self,
        session_id: &str,
        input: &str,
        model: Option<&str>,
        app_handle: tauri::AppHandle,
    ) -> AppResult<()> {
        // セッションの worktree_path と claude_session_id を取得
        let (worktree_path, claude_session_id) = {
            let sessions = self.sessions.lock().unwrap();
            let s = sessions
                .get(session_id)
                .ok_or_else(|| AppError::NotFound(format!("No session for {session_id}")))?;
            if s.info.status != SessionStatus::Running {
                return Err(AppError::Claude("Session is not running".to_string()));
            }
            (s.info.worktree_path.clone(), s.info.claude_session_id.clone())
        };

        let sid = session_id.to_string();
        let wp = worktree_path.clone();
        let input = input.to_string();
        let model = model.map(|s| s.to_string());
        let csid = claude_session_id;
        let app = app_handle.clone();

        let task = tokio::spawn(async move {
            Self::run_command_streaming(&sid, &wp, &input, model.as_deref(), csid.as_deref(), &app).await
        });

        // abort handle を保存
        {
            let mut sessions = self.sessions.lock().unwrap();
            if let Some(s) = sessions.get_mut(session_id) {
                s.abort_handle = Some(task.abort_handle());
            }
        }

        // タスクの完了を待つ（abort された場合はエラー）
        match task.await {
            Ok(result) => {
                // abort handle をクリア
                let mut sessions = self.sessions.lock().unwrap();
                if let Some(s) = sessions.get_mut(session_id) {
                    s.abort_handle = None;
                }
                result
            }
            Err(e) if e.is_cancelled() => {
                // タスクが abort された（stop_session による中断）
                let _ = app_handle.emit(
                    "claude-command-completed",
                    CommandCompletedEvent {
                        worktree_path,
                        session_id: Some(session_id.to_string()),
                    },
                );
                Ok(())
            }
            Err(e) => Err(AppError::Claude(format!("Command task failed: {e}"))),
        }
    }

    /// 実際のストリーミングコマンド実行
    async fn run_command_streaming(
        session_id: &str,
        worktree_path: &str,
        input: &str,
        model: Option<&str>,
        claude_session_id: Option<&str>,
        app_handle: &tauri::AppHandle,
    ) -> AppResult<()> {
        let mut args = vec!["-p".to_string(), input.to_string()];
        if let Some(m) = model {
            args.push("--model".to_string());
            args.push(m.to_string());
        }
        // claude_session_id がある場合は --resume で会話コンテキストを維持
        if let Some(csid) = claude_session_id {
            args.push("--resume".to_string());
            args.push(csid.to_string());
        }

        let mut child = Command::new("claude")
            .args(&args)
            .current_dir(worktree_path)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| AppError::Claude(format!("Failed to spawn claude: {e}")))?;

        let stdout = child.stdout.take().unwrap();
        let stderr = child.stderr.take().unwrap();

        let sid = Some(session_id.to_string());
        let stdout_handle = Self::spawn_line_reader(
            stdout,
            worktree_path.to_string(),
            ClaudeOutputStream::Stdout,
            sid.clone(),
            app_handle.clone(),
        );
        let stderr_handle = Self::spawn_line_reader(
            stderr,
            worktree_path.to_string(),
            ClaudeOutputStream::Stderr,
            sid.clone(),
            app_handle.clone(),
        );

        let status = child
            .wait()
            .await
            .map_err(|e| AppError::Claude(format!("Failed to wait for claude: {e}")))?;

        let _ = stdout_handle.await;
        let _ = stderr_handle.await;

        // command-completed イベント
        let _ = app_handle.emit(
            "claude-command-completed",
            CommandCompletedEvent {
                worktree_path: worktree_path.to_string(),
                session_id: sid,
            },
        );

        if !status.success() {
            return Err(AppError::Claude("Claude command failed".to_string()));
        }

        Ok(())
    }

    pub fn get_output(&self, session_id: &str) -> Vec<ClaudeOutput> {
        let sessions = self.sessions.lock().unwrap();
        sessions.get(session_id).map(|s| s.outputs.clone()).unwrap_or_default()
    }

    fn spawn_line_reader<R: tokio::io::AsyncRead + Unpin + Send + 'static>(
        reader: R,
        worktree_path: String,
        stream_type: ClaudeOutputStream,
        session_id: Option<String>,
        app_handle: tauri::AppHandle,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let buf = BufReader::new(reader);
            let mut lines = buf.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let out = ClaudeOutput {
                    worktree_path: worktree_path.clone(),
                    stream: stream_type.clone(),
                    content: line,
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    session_id: session_id.clone(),
                };
                let _ = app_handle.emit("claude-output", &out);
            }
        })
    }
}

impl Default for ClaudeSessionManager {
    fn default() -> Self {
        Self::new()
    }
}
