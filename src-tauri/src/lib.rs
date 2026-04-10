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
            // claude-code-integration (12)
            features::claude_code_integration::presentation::commands::claude_start_session,
            features::claude_code_integration::presentation::commands::claude_stop_session,
            features::claude_code_integration::presentation::commands::claude_get_session,
            features::claude_code_integration::presentation::commands::claude_get_all_sessions,
            features::claude_code_integration::presentation::commands::claude_send_command,
            features::claude_code_integration::presentation::commands::claude_get_output,
            features::claude_code_integration::presentation::commands::claude_check_auth,
            features::claude_code_integration::presentation::commands::claude_login,
            features::claude_code_integration::presentation::commands::claude_logout,
            features::claude_code_integration::presentation::commands::claude_generate_commit_message,
            features::claude_code_integration::presentation::commands::claude_review_diff,
            features::claude_code_integration::presentation::commands::claude_explain_diff,
            // advanced-git-operations (24)
            features::advanced_git_operations::presentation::commands::git_merge,
            features::advanced_git_operations::presentation::commands::git_merge_abort,
            features::advanced_git_operations::presentation::commands::git_merge_status,
            features::advanced_git_operations::presentation::commands::git_rebase,
            features::advanced_git_operations::presentation::commands::git_rebase_interactive,
            features::advanced_git_operations::presentation::commands::git_rebase_abort,
            features::advanced_git_operations::presentation::commands::git_rebase_continue,
            features::advanced_git_operations::presentation::commands::git_rebase_get_commits,
            features::advanced_git_operations::presentation::commands::git_stash_save,
            features::advanced_git_operations::presentation::commands::git_stash_list,
            features::advanced_git_operations::presentation::commands::git_stash_pop,
            features::advanced_git_operations::presentation::commands::git_stash_apply,
            features::advanced_git_operations::presentation::commands::git_stash_drop,
            features::advanced_git_operations::presentation::commands::git_stash_clear,
            features::advanced_git_operations::presentation::commands::git_cherry_pick,
            features::advanced_git_operations::presentation::commands::git_cherry_pick_abort,
            features::advanced_git_operations::presentation::commands::git_conflict_list,
            features::advanced_git_operations::presentation::commands::git_conflict_file_content,
            features::advanced_git_operations::presentation::commands::git_conflict_resolve,
            features::advanced_git_operations::presentation::commands::git_conflict_resolve_all,
            features::advanced_git_operations::presentation::commands::git_conflict_mark_resolved,
            features::advanced_git_operations::presentation::commands::git_tag_list,
            features::advanced_git_operations::presentation::commands::git_tag_create,
            features::advanced_git_operations::presentation::commands::git_tag_delete,
            // basic-git-operations (12)
            features::basic_git_operations::presentation::commands::git_stage,
            features::basic_git_operations::presentation::commands::git_stage_all,
            features::basic_git_operations::presentation::commands::git_unstage,
            features::basic_git_operations::presentation::commands::git_unstage_all,
            features::basic_git_operations::presentation::commands::git_commit,
            features::basic_git_operations::presentation::commands::git_push,
            features::basic_git_operations::presentation::commands::git_pull,
            features::basic_git_operations::presentation::commands::git_fetch,
            features::basic_git_operations::presentation::commands::git_branch_create,
            features::basic_git_operations::presentation::commands::git_branch_checkout,
            features::basic_git_operations::presentation::commands::git_branch_delete,
            features::basic_git_operations::presentation::commands::git_reset,
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
