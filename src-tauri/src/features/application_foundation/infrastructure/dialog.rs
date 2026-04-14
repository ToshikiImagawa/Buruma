//! tauri-plugin-dialog を使ったフォルダ選択ダイアログ実装。

use async_trait::async_trait;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::error::AppResult;
use crate::features::application_foundation::application::repositories::DialogRepository;

pub struct TauriDialogRepository {
    app_handle: AppHandle,
}

impl TauriDialogRepository {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }
}

#[async_trait]
impl DialogRepository for TauriDialogRepository {
    async fn show_open_directory_dialog(&self) -> AppResult<Option<String>> {
        let result = self
            .app_handle
            .dialog()
            .file()
            .set_title("リポジトリを選択")
            .blocking_pick_folder();
        Ok(result.map(|p| p.to_string()))
    }
}
