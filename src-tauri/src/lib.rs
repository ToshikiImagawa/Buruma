//! Buruma Tauri backend library.
//!
//! Phase IA: 最小限のエントリポイント + `ping` 疎通コマンド。
//! `tauri-plugin-dialog` / `tauri-plugin-store` はデプス追加のみで、
//! プラグイン初期化 + capability 付与は Phase IB (application-foundation) で実施する。

pub mod error;
pub mod git;
pub mod state;

/// Phase IA 疎通確認用コマンド。Webview 起動時に `invoke<string>('ping', { msg: 'hello' })` で呼ばれ、
/// Rust 側 ↔ Webview 側の IPC が疎通していることを確認する。Phase IH 以降で削除する。
#[tauri::command]
fn ping(msg: String) -> String {
    format!("{msg} world from tauri")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
