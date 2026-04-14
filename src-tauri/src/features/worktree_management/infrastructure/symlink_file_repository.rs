//! SymlinkFileRepository 実装 — クロスプラットフォーム symlink 作成（FR_106）。

use async_trait::async_trait;
use std::path::Path;

use crate::error::{AppError, AppResult};
use crate::features::worktree_management::application::symlink_interfaces::SymlinkFileRepository;

pub struct DefaultSymlinkFileRepository;

#[async_trait]
impl SymlinkFileRepository for DefaultSymlinkFileRepository {
    async fn create_symlink(&self, source: &str, target: &str) -> AppResult<()> {
        // ソースの存在確認（async）
        if tokio::fs::metadata(source).await.is_err() {
            return Err(AppError::GitOperation {
                code: "SYMLINK_SOURCE_NOT_FOUND".to_string(),
                message: format!("シンボリックリンクのソースが見つかりません: {source}"),
            });
        }
        // ターゲットが既に存在する場合はエラー（symlink_metadata はリンク自体を確認）
        if tokio::fs::symlink_metadata(target).await.is_ok() {
            return Err(AppError::GitOperation {
                code: "SYMLINK_TARGET_EXISTS".to_string(),
                message: format!("シンボリックリンクのターゲットが既に存在します: {target}"),
            });
        }
        // C1: ターゲットの親ディレクトリを作成
        let target_path = Path::new(target);
        if let Some(parent) = target_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| AppError::GitOperation {
                    code: "SYMLINK_PARENT_CREATE_FAILED".to_string(),
                    message: format!("ターゲットの親ディレクトリ作成に失敗: {}: {e}", parent.display()),
                })?;
        }

        create_symlink_platform(source, target).await
    }
}

#[cfg(unix)]
async fn create_symlink_platform(source: &str, target: &str) -> AppResult<()> {
    tokio::fs::symlink(source, target)
        .await
        .map_err(|e| AppError::GitOperation {
            code: "SYMLINK_CREATE_FAILED".to_string(),
            message: format!("シンボリックリンクの作成に失敗: {target} -> {source}: {e}"),
        })
}

#[cfg(windows)]
async fn create_symlink_platform(source: &str, target: &str) -> AppResult<()> {
    let source = source.to_string();
    let target = target.to_string();
    tokio::task::spawn_blocking(move || {
        let source_path = std::path::Path::new(&source);
        let result = if source_path.is_dir() {
            std::os::windows::fs::symlink_dir(&source, &target)
        } else {
            std::os::windows::fs::symlink_file(&source, &target)
        };
        result.map_err(|e| AppError::GitOperation {
            code: "SYMLINK_CREATE_FAILED".to_string(),
            message: format!("シンボリックリンクの作成に失敗: {target} -> {source}: {e}"),
        })
    })
    .await
    .map_err(|e| AppError::Internal(format!("spawn_blocking failed: {e}")))?
}
