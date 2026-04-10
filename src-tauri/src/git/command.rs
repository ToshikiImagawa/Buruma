//! `tokio::process::Command` ベースの git CLI 実行ヘルパー。

use tokio::process::Command;

use crate::error::{AppError, AppResult};

/// git CLI を引数付きで実行し、stdout を文字列で返す。
pub async fn raw(cwd: &str, args: &[&str]) -> AppResult<String> {
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
