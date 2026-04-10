//! tauri-plugin-store を使った KV ストア実装。
//!
//! `settings.json` ファイルにリポジトリ一覧とアプリケーション設定を永続化する。
//! Phase IB (B2) で get/set メソッドを実装する。

use crate::error::{AppError, AppResult};
use crate::features::application_foundation::application::repositories::StoreRepository;
use crate::features::application_foundation::domain::{AppSettings, RecentRepository};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "settings.json";

pub struct TauriStoreRepository {
    app_handle: AppHandle,
}

impl TauriStoreRepository {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }
}

impl StoreRepository for TauriStoreRepository {
    fn get_recent_repositories(&self) -> AppResult<Vec<RecentRepository>> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        let repos = store
            .get("recentRepositories")
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        Ok(repos)
    }

    fn set_recent_repositories(&self, repos: &[RecentRepository]) -> AppResult<()> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        store.set(
            "recentRepositories",
            serde_json::to_value(repos).map_err(AppError::Serde)?,
        );
        store
            .save()
            .map_err(|e| AppError::Repository(e.to_string()))?;
        Ok(())
    }

    fn get_settings(&self) -> AppResult<AppSettings> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        let settings = store
            .get("settings")
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        Ok(settings)
    }

    fn set_settings(&self, settings: &AppSettings) -> AppResult<()> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        store.set(
            "settings",
            serde_json::to_value(settings).map_err(AppError::Serde)?,
        );
        store
            .save()
            .map_err(|e| AppError::Repository(e.to_string()))?;
        Ok(())
    }
}
