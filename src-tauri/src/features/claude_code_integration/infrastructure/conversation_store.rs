//! 会話永続化ストア。
//!
//! `claude-conversations.json` に会話データを永続化する。
//! `tauri-plugin-store` を使い、既存の `TauriStoreRepository` と同一パターン。

use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::error::{AppError, AppResult};
use crate::features::claude_code_integration::application::repositories::ConversationStoreRepository;
use crate::features::claude_code_integration::domain::PersistedConversation;

const STORE_FILE: &str = "claude-conversations.json";

pub struct TauriConversationStoreRepository {
    app_handle: AppHandle,
}

impl TauriConversationStoreRepository {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }
}

impl ConversationStoreRepository for TauriConversationStoreRepository {
    fn get_conversations(&self) -> AppResult<Vec<PersistedConversation>> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        let conversations = store
            .get("conversations")
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        Ok(conversations)
    }

    fn set_conversations(&self, conversations: &[PersistedConversation]) -> AppResult<()> {
        let store = self
            .app_handle
            .store(STORE_FILE)
            .map_err(|e| AppError::Repository(e.to_string()))?;
        store.set(
            "conversations",
            serde_json::to_value(conversations).map_err(AppError::Serde)?,
        );
        store.save().map_err(|e| AppError::Repository(e.to_string()))?;
        Ok(())
    }
}
