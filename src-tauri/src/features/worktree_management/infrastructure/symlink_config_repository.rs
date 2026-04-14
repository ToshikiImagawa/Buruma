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

impl DefaultSymlinkConfigRepository {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// `.buruma/symlink.json` からリポジトリローカル設定を読み込む。
    async fn read_repo_config(&self, repo_path: &str) -> Option<SymlinkConfig> {
        let config_path = Path::new(repo_path).join(".buruma").join("symlink.json");
        let content = tokio::fs::read_to_string(config_path).await.ok()?;
        let patterns: Vec<String> = serde_json::from_str(&content).ok()?;
        Some(SymlinkConfig {
            patterns,
            source: SymlinkConfigSource::Repo,
        })
    }

    /// `.buruma/symlink.json` にリポジトリローカル設定を保存する。
    async fn write_repo_config(&self, repo_path: &str, config: &SymlinkConfig) -> AppResult<()> {
        let buruma_dir = Path::new(repo_path).join(".buruma");
        tokio::fs::create_dir_all(&buruma_dir).await?;
        let config_path = buruma_dir.join("symlink.json");
        let content = serde_json::to_string_pretty(&config.patterns)?;
        tokio::fs::write(&config_path, content).await?;
        Ok(())
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
        if let Some(repo_config) = self.read_repo_config(repo_path).await {
            return Ok(repo_config);
        }
        self.read_app_config()
    }

    async fn set_config(&self, repo_path: &str, config: &SymlinkConfig) -> AppResult<()> {
        match config.source {
            SymlinkConfigSource::Repo => self.write_repo_config(repo_path, config).await,
            SymlinkConfigSource::App => self.write_app_config(config),
        }
    }
}
