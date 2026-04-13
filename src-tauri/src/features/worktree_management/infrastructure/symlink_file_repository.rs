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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_symlink_file_success() {
        let tmp = tempfile::tempdir().unwrap();

        let source = tmp.path().join("source.txt");
        std::fs::write(&source, "hello").unwrap();
        let target = tmp.path().join("link.txt");

        let repo = DefaultSymlinkFileRepository;
        let result = repo
            .create_symlink(source.to_str().unwrap(), target.to_str().unwrap())
            .await;
        assert!(result.is_ok());
        assert!(target.is_symlink());
        assert_eq!(std::fs::read_to_string(&target).unwrap(), "hello");
    }

    #[tokio::test]
    async fn test_create_symlink_dir_success() {
        let tmp = tempfile::tempdir().unwrap();

        let source_dir = tmp.path().join("source_dir");
        std::fs::create_dir_all(&source_dir).unwrap();
        std::fs::write(source_dir.join("inner.txt"), "content").unwrap();
        let target = tmp.path().join("link_dir");

        let repo = DefaultSymlinkFileRepository;
        let result = repo
            .create_symlink(source_dir.to_str().unwrap(), target.to_str().unwrap())
            .await;
        assert!(result.is_ok());
        assert!(target.is_symlink());
    }

    #[tokio::test]
    async fn test_create_symlink_source_not_found() {
        let tmp = tempfile::tempdir().unwrap();

        let source = tmp.path().join("nonexistent.txt");
        let target = tmp.path().join("link.txt");

        let repo = DefaultSymlinkFileRepository;
        let result = repo
            .create_symlink(source.to_str().unwrap(), target.to_str().unwrap())
            .await;
        match result.unwrap_err() {
            AppError::GitOperation { code, .. } => assert_eq!(code, "SYMLINK_SOURCE_NOT_FOUND"),
            other => panic!("unexpected error variant: {other:?}"),
        }
    }

    #[tokio::test]
    async fn test_create_symlink_target_already_exists() {
        let tmp = tempfile::tempdir().unwrap();

        let source = tmp.path().join("source.txt");
        std::fs::write(&source, "data").unwrap();
        let target = tmp.path().join("existing.txt");
        std::fs::write(&target, "already here").unwrap();

        let repo = DefaultSymlinkFileRepository;
        let result = repo
            .create_symlink(source.to_str().unwrap(), target.to_str().unwrap())
            .await;
        match result.unwrap_err() {
            AppError::GitOperation { code, .. } => assert_eq!(code, "SYMLINK_TARGET_EXISTS"),
            other => panic!("unexpected error variant: {other:?}"),
        }
    }

    #[tokio::test]
    async fn test_create_symlink_creates_parent_dirs() {
        let tmp = tempfile::tempdir().unwrap();

        let source = tmp.path().join("source.txt");
        std::fs::write(&source, "nested").unwrap();
        let target = tmp.path().join("deep").join("nested").join("link.txt");

        let repo = DefaultSymlinkFileRepository;
        let result = repo
            .create_symlink(source.to_str().unwrap(), target.to_str().unwrap())
            .await;
        assert!(result.is_ok());
        assert!(target.is_symlink());
    }
}
