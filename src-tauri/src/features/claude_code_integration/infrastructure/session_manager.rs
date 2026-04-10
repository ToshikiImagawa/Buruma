//! ClaudeSessionManager — Claude Code CLI プロセスの起動・管理・I/O ストリーミング。

use std::collections::HashMap;
use std::sync::Mutex;

use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Child;

use crate::error::{AppError, AppResult};
use crate::features::claude_code_integration::domain::{
    ClaudeOutput, ClaudeOutputStream, ClaudeSession, CommandCompletedEvent, SessionStatus,
};

struct ManagedSession {
    info: ClaudeSession,
    stdin: Option<tokio::process::ChildStdin>,
    outputs: Vec<ClaudeOutput>,
}

pub struct ClaudeSessionManager {
    sessions: Mutex<HashMap<String, ManagedSession>>,
}

impl ClaudeSessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    /// セッション開始: `claude` CLI を対話モードで起動。
    pub async fn start_session(
        &self,
        worktree_path: &str,
        app_handle: tauri::AppHandle,
    ) -> AppResult<ClaudeSession> {
        // 既存セッションがあれば返す
        {
            let sessions = self.sessions.lock().unwrap();
            if let Some(s) = sessions.get(worktree_path) {
                if s.info.status == SessionStatus::Running {
                    return Ok(s.info.clone());
                }
            }
        }

        let mut child = tokio::process::Command::new("claude")
            .current_dir(worktree_path)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| AppError::Claude(format!("Failed to start claude CLI: {e}")))?;

        let pid = child.id();
        let now = chrono::Utc::now().to_rfc3339();

        let session = ClaudeSession {
            worktree_path: worktree_path.to_string(),
            status: SessionStatus::Running,
            pid,
            started_at: Some(now),
            error: None,
        };

        let stdin = child.stdin.take();

        // stdout/stderr ストリーミング
        self.spawn_output_reader(&mut child, worktree_path, app_handle.clone());

        // プロセス終了監視
        self.spawn_exit_watcher(child, worktree_path, app_handle);

        // セッション登録
        {
            let mut sessions = self.sessions.lock().unwrap();
            sessions.insert(
                worktree_path.to_string(),
                ManagedSession {
                    info: session.clone(),
                    stdin,
                    outputs: Vec::new(),
                },
            );
        }

        Ok(session)
    }

    /// セッション停止。
    pub async fn stop_session(
        &self,
        worktree_path: &str,
        app_handle: tauri::AppHandle,
    ) -> AppResult<()> {
        let pid = {
            let mut sessions = self.sessions.lock().unwrap();
            if let Some(s) = sessions.get_mut(worktree_path) {
                s.info.status = SessionStatus::Stopping;
                s.stdin.take(); // stdin を閉じてプロセスに EOF を送る
                s.info.pid
            } else {
                return Err(AppError::NotFound(format!(
                    "No session for {worktree_path}"
                )));
            }
        };

        // PID でプロセスを kill（stdin close で終了しない場合のフォールバック）
        if let Some(pid) = pid {
            let _ = tokio::process::Command::new("kill")
                .arg(pid.to_string())
                .output()
                .await;
        }

        // セッション状態更新
        {
            let mut sessions = self.sessions.lock().unwrap();
            if let Some(s) = sessions.get_mut(worktree_path) {
                s.info.status = SessionStatus::Idle;
                s.info.pid = None;
            }
        }

        let session = self.get_session(worktree_path);
        if let Some(session) = session {
            let _ = app_handle.emit("claude-session-changed", &session);
        }

        Ok(())
    }

    /// セッション取得。
    pub fn get_session(&self, worktree_path: &str) -> Option<ClaudeSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.get(worktree_path).map(|s| s.info.clone())
    }

    /// 全セッション取得。
    pub fn get_all_sessions(&self) -> Vec<ClaudeSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.values().map(|s| s.info.clone()).collect()
    }

    /// コマンド送信（stdin 経由）。
    pub async fn send_command(
        &self,
        worktree_path: &str,
        input: &str,
        app_handle: tauri::AppHandle,
    ) -> AppResult<()> {
        // stdin への書き込みは Mutex 内で直接 await できないため、take → 書き込み → 戻す
        let stdin = {
            let mut sessions = self.sessions.lock().unwrap();
            let s = sessions
                .get_mut(worktree_path)
                .ok_or_else(|| AppError::NotFound(format!("No session for {worktree_path}")))?;
            s.stdin.take()
        };

        if let Some(mut stdin) = stdin {
            let write_result = stdin
                .write_all(format!("{input}\n").as_bytes())
                .await
                .map_err(|e| AppError::Claude(format!("Failed to write to stdin: {e}")));

            // stdin を戻す
            {
                let mut sessions = self.sessions.lock().unwrap();
                if let Some(s) = sessions.get_mut(worktree_path) {
                    s.stdin = Some(stdin);
                }
            }

            write_result?;

            let _ = app_handle.emit(
                "claude-command-completed",
                CommandCompletedEvent {
                    worktree_path: worktree_path.to_string(),
                },
            );

            Ok(())
        } else {
            Err(AppError::Claude("Session stdin not available".to_string()))
        }
    }

    /// 蓄積した出力を取得。
    pub fn get_output(&self, worktree_path: &str) -> Vec<ClaudeOutput> {
        let sessions = self.sessions.lock().unwrap();
        sessions
            .get(worktree_path)
            .map(|s| s.outputs.clone())
            .unwrap_or_default()
    }

    /// 出力を追加（ストリーミングタスクから呼ばれる）。
    pub fn append_output(&self, worktree_path: &str, output: ClaudeOutput) {
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(s) = sessions.get_mut(worktree_path) {
            // 最大 1000 件に制限
            if s.outputs.len() >= 1000 {
                s.outputs.remove(0);
            }
            s.outputs.push(output);
        }
    }

    // --- 内部ヘルパー ---

    fn spawn_output_reader(
        &self,
        child: &mut Child,
        worktree_path: &str,
        app_handle: tauri::AppHandle,
    ) {
        if let Some(stdout) = child.stdout.take() {
            let app = app_handle.clone();
            let wt = worktree_path.to_string();
            // self への参照を持てないため、raw pointer のようなアプローチは避ける
            // 代わりに emit のみ行い、append_output は別途呼ぶ
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let output = ClaudeOutput {
                        worktree_path: wt.clone(),
                        stream: ClaudeOutputStream::Stdout,
                        content: line,
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };
                    let _ = app.emit("claude-output", &output);
                }
            });
        }

        if let Some(stderr) = child.stderr.take() {
            let app = app_handle;
            let wt = worktree_path.to_string();
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let output = ClaudeOutput {
                        worktree_path: wt.clone(),
                        stream: ClaudeOutputStream::Stderr,
                        content: line,
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };
                    let _ = app.emit("claude-output", &output);
                }
            });
        }
    }

    fn spawn_exit_watcher(
        &self,
        mut child: Child,
        worktree_path: &str,
        app_handle: tauri::AppHandle,
    ) {
        let wt = worktree_path.to_string();
        tokio::spawn(async move {
            let _ = child.wait().await;
            // プロセス終了 → idle に遷移してイベント発信
            let session = ClaudeSession {
                worktree_path: wt,
                status: SessionStatus::Idle,
                pid: None,
                started_at: None,
                error: None,
            };
            let _ = app_handle.emit("claude-session-changed", &session);
        });
    }
}

impl Default for ClaudeSessionManager {
    fn default() -> Self {
        Self::new()
    }
}
