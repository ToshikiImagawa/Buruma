//! Buruma Tauri backend library.
//!
//! Phase IA: 最小限のエントリポイント。`#[tauri::command]` は A2 以降で追加する。
//! `tauri-plugin-dialog` / `tauri-plugin-store` はデプス追加のみで、
//! プラグイン初期化 + capability 付与は Phase IB (application-foundation) で実施する。

pub mod error;
pub mod git;
pub mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
