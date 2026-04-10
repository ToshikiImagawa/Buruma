//! Buruma Tauri backend library.
//!
//! Phase IB: application-foundation feature の Rust 側実装。
//! `tauri-plugin-dialog` / `tauri-plugin-store` の初期化と 10 command の登録。

pub mod error;
pub mod features;
pub mod git;
pub mod state;

use tauri::Manager;

use state::AppState;

/// Phase IA 疎通確認用コマンド。Phase IH 以降で削除する。
#[tauri::command]
fn ping(msg: String) -> String {
    format!("{msg} world from tauri")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_state = AppState::new(app.handle());
            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
