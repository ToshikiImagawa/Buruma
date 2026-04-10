//! ワークツリー変更監視 — `.git/worktrees/` を notify-debouncer-full で監視。
//! 旧 TS `worktree-default-watcher.ts` (chokidar) の移植。

use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;

use notify::{RecursiveMode, Watcher};
use notify_debouncer_full::{new_debouncer, Debouncer, FileIdMap};
use tauri::{AppHandle, Emitter};

use crate::features::worktree_management::domain::WorktreeChangeEvent;

type FileWatcher = Debouncer<notify::RecommendedWatcher, FileIdMap>;

pub struct WorktreeWatcher {
    debouncer: Mutex<Option<FileWatcher>>,
}

impl Default for WorktreeWatcher {
    fn default() -> Self {
        Self::new()
    }
}

impl WorktreeWatcher {
    pub fn new() -> Self {
        Self {
            debouncer: Mutex::new(None),
        }
    }

    /// 指定リポジトリの `.git/worktrees/` ディレクトリを監視開始する。
    /// 既存の watcher がある場合は停止してから再開する。
    pub fn start_watching(&self, repo_path: &str, app_handle: AppHandle) {
        self.stop_watching();

        let watch_path = Path::new(repo_path).join(".git").join("worktrees");
        if !watch_path.exists() {
            return; // worktrees ディレクトリが無い場合は監視しない
        }

        let repo_path_owned = repo_path.to_string();
        let debouncer = new_debouncer(
            Duration::from_millis(300),
            None,
            move |result: notify_debouncer_full::DebounceEventResult| {
                if let Ok(events) = result {
                    if !events.is_empty() {
                        let event = WorktreeChangeEvent {
                            repo_path: repo_path_owned.clone(),
                            change_type: "modified".to_string(),
                            worktree_path: repo_path_owned.clone(),
                        };
                        let _ = app_handle.emit("worktree-changed", &event);
                    }
                }
            },
        );

        match debouncer {
            Ok(mut d) => {
                if d.watcher()
                    .watch(&watch_path, RecursiveMode::NonRecursive)
                    .is_ok()
                {
                    if let Ok(mut guard) = self.debouncer.lock() {
                        *guard = Some(d);
                    }
                }
            }
            Err(e) => {
                eprintln!("[watcher] Failed to create debouncer: {e}");
            }
        }
    }

    pub fn stop_watching(&self) {
        if let Ok(mut guard) = self.debouncer.lock() {
            *guard = None; // drop で watcher が停止
        }
    }
}
