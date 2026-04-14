//! Git リポジトリ検証 — `git rev-parse --is-inside-work-tree` を shell out で実行。

use async_trait::async_trait;
use tokio::process::Command;

use crate::error::AppResult;
use crate::features::application_foundation::application::repositories::GitValidationRepository;

pub struct DefaultGitValidationRepository;

#[async_trait]
impl GitValidationRepository for DefaultGitValidationRepository {
    async fn is_git_repository(&self, dir_path: &str) -> AppResult<bool> {
        let output = Command::new("git")
            .args(["rev-parse", "--is-inside-work-tree"])
            .current_dir(dir_path)
            .output()
            .await;
        match output {
            Ok(o) => Ok(o.status.success()),
            Err(_) => Ok(false),
        }
    }
}
