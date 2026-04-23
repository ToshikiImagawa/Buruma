//! `tokio::process::Command` ベースの git CLI 実行ヘルパー。
//!
//! 同一 worktree に対する git コマンドを `tokio::sync::Mutex` でシリアライズし、
//! `index.lock` の競合を防止する。

use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use tokio::process::Command;

use crate::error::{AppError, AppResult};

/// worktree パスごとの非同期ロック。
/// 同一 worktree への git コマンド並行実行による `index.lock` 競合を防ぐ。
static WORKTREE_LOCKS: OnceLock<Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>>> = OnceLock::new();

/// 指定 worktree の非同期ロックを取得する。
/// feature-local ヘルパーで `Command::new("git")` を直接実行する場合にも使用する。
pub fn get_worktree_lock(cwd: &str) -> Arc<tokio::sync::Mutex<()>> {
    let map = WORKTREE_LOCKS.get_or_init(|| Mutex::new(HashMap::new()));
    let mut locks = map.lock().unwrap();
    locks.entry(cwd.to_string()).or_default().clone()
}

/// git CLI を引数付きで実行し、stdout を文字列で返す。
/// 同一 worktree への並行実行はロックでシリアライズされる。
pub async fn raw(cwd: &str, args: &[&str]) -> AppResult<String> {
    let lock = get_worktree_lock(cwd);
    let _guard = lock.lock().await;

    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .await
        .map_err(|e| AppError::GitError(format!("git command failed: {e}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::GitError(stderr.trim().to_string()));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// git CLI を実行し、失敗時は空文字列を返す（`git show` 等で存在しない場合のフォールバック用）。
pub async fn raw_or_empty(cwd: &str, args: &[&str]) -> String {
    raw(cwd, args).await.unwrap_or_default()
}
