//! ClaudeSessionManager — Claude Code CLI セッション管理。
//!
//! 会話ごとに独立したセッションを作成し、`claude -p "..."` で実行する。
//! セッションは UUID で識別し、同一 worktree で複数セッションを保持可能。
//! stdout/stderr はストリーミングで行ごとにイベント発信する。

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use serde_json::Value;
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
    /// `session_id` / `claude_session_id` を指定すると復元用にその値を使用する。
    pub async fn start_session(
        &self,
        worktree_path: &str,
        session_id: Option<&str>,
        claude_session_id: Option<&str>,
        app_handle: tauri::AppHandle,
    ) -> AppResult<ClaudeSession> {
        // claude CLI の存在確認
        let check = Command::new("claude").arg("--version").output().await;

        if check.is_err() || !check.as_ref().unwrap().status.success() {
            return Err(AppError::Claude(
                "Claude Code CLI が見つかりません。`claude` コマンドをインストールしてください。".to_string(),
            ));
        }

        let session_id = session_id
            .map(|s| s.to_string())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let now = chrono::Utc::now().to_rfc3339();
        let session = ClaudeSession {
            id: session_id.clone(),
            worktree_path: worktree_path.to_string(),
            status: SessionStatus::Running,
            pid: None,
            started_at: Some(now),
            error: None,
            claude_session_id: claude_session_id.map(|s| s.to_string()),
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
                // 1. claude_session_id を更新し session-changed を先に発信
                let changed_session = {
                    let mut sessions = self.sessions.lock().unwrap();
                    sessions.get_mut(session_id).and_then(|s| {
                        s.abort_handle = None;
                        if let Ok(Some(ref csid)) = result {
                            s.info.claude_session_id = Some(csid.clone());
                            Some(s.info.clone())
                        } else {
                            None
                        }
                    })
                };
                if let Some(info) = changed_session {
                    let _ = app_handle.emit("claude-session-changed", &info);
                }
                // 2. command-completed を後に発信（フロントの永続化で claudeSessionId を含めるため）
                let _ = app_handle.emit(
                    "claude-command-completed",
                    CommandCompletedEvent {
                        worktree_path,
                        session_id: Some(session_id.to_string()),
                    },
                );
                result.map(|_| ())
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

    /// 実際のストリーミングコマンド実行。
    /// `--output-format stream-json` で JSON Lines を受け取り、テキストを抽出して出力。
    /// CLI の session_id をキャプチャして返す（`--resume` 用）。
    async fn run_command_streaming(
        session_id: &str,
        worktree_path: &str,
        input: &str,
        model: Option<&str>,
        claude_session_id: Option<&str>,
        app_handle: &tauri::AppHandle,
    ) -> AppResult<Option<String>> {
        let mut args = vec!["-p".to_string(), input.to_string()];
        args.push("--output-format".to_string());
        args.push("stream-json".to_string());
        args.push("--verbose".to_string());
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
        let captured_csid = Arc::new(Mutex::new(None::<String>));

        // stdout: JSON Lines パーサー（テキスト抽出 + session_id キャプチャ）
        let stdout_handle = Self::spawn_json_line_reader(
            stdout,
            worktree_path.to_string(),
            sid.clone(),
            captured_csid.clone(),
            app_handle.clone(),
        );
        // stderr: プレーンテキスト（エラー出力）
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

        let result_csid = captured_csid.lock().unwrap().clone();

        if !status.success() {
            return Err(AppError::Claude("Claude command failed".to_string()));
        }

        Ok(result_csid)
    }

    pub fn get_output(&self, session_id: &str) -> Vec<ClaudeOutput> {
        let sessions = self.sessions.lock().unwrap();
        sessions.get(session_id).map(|s| s.outputs.clone()).unwrap_or_default()
    }

    /// stdout の JSON Lines をパースし、テキストコンテンツを抽出して出力。
    /// CLI の session_id をキャプチャして `captured_csid` に保存。
    fn spawn_json_line_reader<R: tokio::io::AsyncRead + Unpin + Send + 'static>(
        reader: R,
        worktree_path: String,
        session_id: Option<String>,
        captured_csid: Arc<Mutex<Option<String>>>,
        app_handle: tauri::AppHandle,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let buf = BufReader::new(reader);
            let mut lines = buf.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                if let Ok(json) = serde_json::from_str::<Value>(&line) {
                    if let Some(sid) = json.get("session_id").and_then(|v| v.as_str()) {
                        let mut csid = captured_csid.lock().unwrap();
                        *csid = Some(sid.to_string());
                    }

                    if let Some(text) = extract_text_content(&json) {
                        if !text.is_empty() {
                            emit_claude_output(
                                &app_handle,
                                &worktree_path,
                                ClaudeOutputStream::Stdout,
                                text,
                                &session_id,
                            );
                        }
                    }
                } else if !line.is_empty() {
                    // JSON パース失敗時はそのまま出力（フォールバック）
                    eprintln!("[claude-stream-json] JSON parse failed: {}", &line);
                    emit_claude_output(
                        &app_handle,
                        &worktree_path,
                        ClaudeOutputStream::Stdout,
                        line,
                        &session_id,
                    );
                }
            }
        })
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
                emit_claude_output(&app_handle, &worktree_path, stream_type.clone(), line, &session_id);
            }
        })
    }
}

impl Default for ClaudeSessionManager {
    fn default() -> Self {
        Self::new()
    }
}

fn emit_claude_output(
    app_handle: &tauri::AppHandle,
    worktree_path: &str,
    stream: ClaudeOutputStream,
    content: String,
    session_id: &Option<String>,
) {
    let out = ClaudeOutput {
        worktree_path: worktree_path.to_string(),
        stream,
        content,
        timestamp: chrono::Utc::now().to_rfc3339(),
        session_id: session_id.clone(),
    };
    let _ = app_handle.emit("claude-output", &out);
}

/// stream-json の JSON Lines からテキストコンテンツを抽出。
/// `assistant` メッセージの `message.content` 配列内の `text` ブロックを結合して返す。
fn extract_text_content(json: &Value) -> Option<String> {
    let msg_type = json.get("type")?.as_str()?;
    match msg_type {
        "assistant" => {
            let content = json.get("message")?.get("content")?.as_array()?;
            let mut text_parts = Vec::new();
            for block in content {
                if block.get("type").and_then(|v| v.as_str()) == Some("text") {
                    if let Some(text) = block.get("text").and_then(|v| v.as_str()) {
                        text_parts.push(text.to_string());
                    }
                }
            }
            if text_parts.is_empty() {
                None
            } else {
                Some(text_parts.join("\n"))
            }
        }
        "content_block_delta" => json
            .get("delta")?
            .get("text")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        _ => None,
    }
}
