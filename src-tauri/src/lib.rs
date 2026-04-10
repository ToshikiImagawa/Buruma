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
        .invoke_handler(tauri::generate_handler![
            ping,
            features::application_foundation::presentation::commands::repository_open,
            features::application_foundation::presentation::commands::repository_open_path,
            features::application_foundation::presentation::commands::repository_validate,
            features::application_foundation::presentation::commands::repository_get_recent,
            features::application_foundation::presentation::commands::repository_remove_recent,
            features::application_foundation::presentation::commands::repository_pin,
            features::application_foundation::presentation::commands::settings_get,
            features::application_foundation::presentation::commands::settings_set,
            features::application_foundation::presentation::commands::settings_get_theme,
            features::application_foundation::presentation::commands::settings_set_theme,
            // repository-viewer (10)
            features::repository_viewer::presentation::commands::git_status,
            features::repository_viewer::presentation::commands::git_log,
            features::repository_viewer::presentation::commands::git_commit_detail,
            features::repository_viewer::presentation::commands::git_diff,
            features::repository_viewer::presentation::commands::git_diff_staged,
            features::repository_viewer::presentation::commands::git_diff_commit,
            features::repository_viewer::presentation::commands::git_branches,
            features::repository_viewer::presentation::commands::git_file_tree,
            features::repository_viewer::presentation::commands::git_file_contents,
            features::repository_viewer::presentation::commands::git_file_contents_commit,
            // worktree-management (7)
            features::worktree_management::presentation::commands::worktree_list,
            features::worktree_management::presentation::commands::worktree_status,
            features::worktree_management::presentation::commands::worktree_create,
            features::worktree_management::presentation::commands::worktree_delete,
            features::worktree_management::presentation::commands::worktree_suggest_path,
            features::worktree_management::presentation::commands::worktree_check_dirty,
            features::worktree_management::presentation::commands::worktree_default_branch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
