//! SymlinkConfigRepository 実装 — `.buruma/symlink.json` + tauri-plugin-store（FR_106）。

use async_trait::async_trait;
use std::path::Path;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::error::{AppError, AppResult};
use crate::features::worktree_management::application::symlink_interfaces::SymlinkConfigRepository;
use crate::features::worktree_management::domain::{SymlinkConfig, SymlinkConfigSource};

const STORE_FILE: &str = "settings.json";
const STORE_KEY: &str = "symlinkConfig";

pub struct DefaultSymlinkConfigRepository {
    app_handle: AppHandle,
}

/// `.buruma/symlink.json` からリポジトリローカル設定を読み込む。
async fn read_repo_config(repo_path: &str) -> Option<SymlinkConfig> {
    let config_path = Path::new(repo_path).join(".buruma").join("symlink.json");
    let content = tokio::fs::read_to_string(config_path).await.ok()?;
    let patterns: Vec<String> = serde_json::from_str(&content).ok()?;
    Some(SymlinkConfig {
        patterns,
        source: SymlinkConfigSource::Repo,
    })
}

/// `.buruma/symlink.json` にリポジトリローカル設定を保存する。
async fn write_repo_config(repo_path: &str, config: &SymlinkConfig) -> AppResult<()> {
    let buruma_dir = Path::new(repo_path).join(".buruma");
    tokio::fs::create_dir_all(&buruma_dir).await?;
    let config_path = buruma_dir.join("symlink.json");
    let content = serde_json::to_string_pretty(&config.patterns)?;
    tokio::fs::write(&config_path, content).await?;
    Ok(())
}

impl DefaultSymlinkConfigRepository {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// tauri-plugin-store からアプリデフォルト設定を読み込む（store API は同期的で軽量なためそのまま使用）。
    fn read_app_config(&self) -> AppResult<SymlinkConfig> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        let config = store
            .get(STORE_KEY)
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or(SymlinkConfig {
                patterns: Vec::new(),
                source: SymlinkConfigSource::App,
            });
        Ok(SymlinkConfig {
            source: SymlinkConfigSource::App,
            ..config
        })
    }

    /// tauri-plugin-store にアプリデフォルト設定を保存する（store API は同期的で軽量なためそのまま使用）。
    fn write_app_config(&self, config: &SymlinkConfig) -> AppResult<()> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        store.set(STORE_KEY, serde_json::to_value(config).map_err(AppError::Serde)?);
        store.save().map_err(|e| AppError::Repository(e.to_string()))?;
        Ok(())
    }
}

#[async_trait]
impl SymlinkConfigRepository for DefaultSymlinkConfigRepository {
    async fn get_config(&self, repo_path: &str) -> AppResult<SymlinkConfig> {
        if let Some(repo_config) = read_repo_config(repo_path).await {
            return Ok(repo_config);
        }
        self.read_app_config()
    }

    async fn set_config(&self, repo_path: &str, config: &SymlinkConfig) -> AppResult<()> {
        match config.source {
            SymlinkConfigSource::Repo => write_repo_config(repo_path, config).await,
            SymlinkConfigSource::App => self.write_app_config(config),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_config(patterns: Vec<&str>) -> SymlinkConfig {
        SymlinkConfig {
            patterns: patterns.into_iter().map(String::from).collect(),
            source: SymlinkConfigSource::Repo,
        }
    }

    #[tokio::test]
    async fn test_read_repo_config_valid() {
        let tmp = tempfile::tempdir().unwrap();
        let buruma_dir = tmp.path().join(".buruma");
        std::fs::create_dir_all(&buruma_dir).unwrap();
        std::fs::write(buruma_dir.join("symlink.json"), r#"["node_modules", ".env"]"#).unwrap();

        let result = read_repo_config(tmp.path().to_str().unwrap()).await;
        assert!(result.is_some());
        let config = result.unwrap();
        assert_eq!(config.patterns, vec!["node_modules", ".env"]);
        assert!(matches!(config.source, SymlinkConfigSource::Repo));
    }

    #[tokio::test]
    async fn test_read_repo_config_missing_file() {
        let tmp = tempfile::tempdir().unwrap();

        let result = read_repo_config(tmp.path().to_str().unwrap()).await;
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_read_repo_config_invalid_json() {
        let tmp = tempfile::tempdir().unwrap();
        let buruma_dir = tmp.path().join(".buruma");
        std::fs::create_dir_all(&buruma_dir).unwrap();
        std::fs::write(buruma_dir.join("symlink.json"), "not valid json{{{").unwrap();

        let result = read_repo_config(tmp.path().to_str().unwrap()).await;
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_read_repo_config_empty_array() {
        let tmp = tempfile::tempdir().unwrap();
        let buruma_dir = tmp.path().join(".buruma");
        std::fs::create_dir_all(&buruma_dir).unwrap();
        std::fs::write(buruma_dir.join("symlink.json"), "[]").unwrap();

        let result = read_repo_config(tmp.path().to_str().unwrap()).await;
        assert!(result.is_some());
        assert!(result.unwrap().patterns.is_empty());
    }

    #[tokio::test]
    async fn test_write_repo_config_creates_buruma_dir() {
        let tmp = tempfile::tempdir().unwrap();

        let config = make_config(vec!["node_modules"]);
        write_repo_config(tmp.path().to_str().unwrap(), &config).await.unwrap();

        assert!(tmp.path().join(".buruma").exists());
        assert!(tmp.path().join(".buruma").join("symlink.json").exists());
    }

    #[tokio::test]
    async fn test_write_then_read_roundtrip() {
        let tmp = tempfile::tempdir().unwrap();

        let config = make_config(vec![".env", "node_modules", "*.local"]);
        write_repo_config(tmp.path().to_str().unwrap(), &config).await.unwrap();

        let read_back = read_repo_config(tmp.path().to_str().unwrap()).await;
        assert!(read_back.is_some());
        let read_config = read_back.unwrap();
        assert_eq!(read_config.patterns, vec![".env", "node_modules", "*.local"]);
        assert!(matches!(read_config.source, SymlinkConfigSource::Repo));
    }

    #[tokio::test]
    async fn test_write_repo_config_overwrites_existing() {
        let tmp = tempfile::tempdir().unwrap();

        let config1 = make_config(vec!["old_pattern"]);
        write_repo_config(tmp.path().to_str().unwrap(), &config1).await.unwrap();

        let config2 = make_config(vec!["new_pattern_a", "new_pattern_b"]);
        write_repo_config(tmp.path().to_str().unwrap(), &config2).await.unwrap();

        let read_back = read_repo_config(tmp.path().to_str().unwrap()).await.unwrap();
        assert_eq!(read_back.patterns, vec!["new_pattern_a", "new_pattern_b"]);
    }
}
