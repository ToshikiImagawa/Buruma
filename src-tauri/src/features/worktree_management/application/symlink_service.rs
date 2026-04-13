//! SymlinkService — glob マッチ + symlink 作成オーケストレーション（FR_106）。

use std::path::Path;

use crate::features::worktree_management::application::symlink_interfaces::SymlinkFileRepository;
use crate::features::worktree_management::domain::{SymlinkConfig, SymlinkResult, SymlinkResultEntry, SymlinkStatus};

pub struct SymlinkService<'a> {
    file_repo: &'a dyn SymlinkFileRepository,
}

impl<'a> SymlinkService<'a> {
    pub fn new(file_repo: &'a dyn SymlinkFileRepository) -> Self {
        Self { file_repo }
    }

    /// メインWTから新規WTへシンボリックリンクを作成する。
    /// 各パターンに対して glob マッチ → symlink 作成。失敗はスキップして続行。
    pub async fn execute(&self, main_wt_path: &str, new_wt_path: &str, config: &SymlinkConfig) -> SymlinkResult {
        let mut entries = Vec::new();
        let mut total_created: u32 = 0;
        let mut total_skipped: u32 = 0;
        let mut total_failed: u32 = 0;

        for pattern in &config.patterns {
            let entry = self.process_pattern(main_wt_path, new_wt_path, pattern).await;
            total_created += entry.created;
            total_failed += entry.failed;
            if entry.status == SymlinkStatus::Skipped {
                total_skipped += 1;
            }
            entries.push(entry);
        }

        SymlinkResult {
            entries,
            total_created,
            total_skipped,
            total_failed,
        }
    }

    /// 1パターンを処理し、SymlinkResultEntry を返す。
    async fn process_pattern(&self, main_wt_path: &str, new_wt_path: &str, pattern: &str) -> SymlinkResultEntry {
        let glob_pattern = format!("{}/{}", main_wt_path, pattern);
        let paths = match glob::glob(&glob_pattern) {
            Ok(paths) => paths,
            Err(e) => {
                return SymlinkResultEntry {
                    pattern: pattern.to_string(),
                    status: SymlinkStatus::Failed,
                    matched: 0,
                    created: 0,
                    failed: 0,
                    reason: Some(format!("glob パターンエラー: {e}")),
                };
            }
        };

        let mut matched: u32 = 0;
        let mut created: u32 = 0;
        let mut failed: u32 = 0;
        let mut errors: Vec<String> = Vec::new();

        for entry in paths.flatten() {
            matched += 1;
            let source = entry.to_string_lossy().to_string();
            let relative = match entry.strip_prefix(main_wt_path) {
                Ok(rel) => rel,
                Err(_) => {
                    failed += 1;
                    errors.push(format!("{}: 相対パス算出失敗", entry.display()));
                    continue;
                }
            };
            let target = Path::new(new_wt_path).join(relative).to_string_lossy().to_string();

            match self.file_repo.create_symlink(&source, &target).await {
                Ok(()) => created += 1,
                Err(e) => {
                    failed += 1;
                    errors.push(format!("{}: {e}", entry.display()));
                }
            }
        }

        let status = if matched == 0 {
            SymlinkStatus::Skipped
        } else if failed == 0 {
            SymlinkStatus::Created
        } else if created > 0 {
            SymlinkStatus::Partial
        } else {
            SymlinkStatus::Failed
        };

        SymlinkResultEntry {
            pattern: pattern.to_string(),
            status,
            matched,
            created,
            failed,
            reason: if errors.is_empty() {
                None
            } else {
                Some(errors.join("; "))
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::{AppError, AppResult};
    use std::sync::Mutex;

    struct MockSymlinkFileRepo {
        call_log: Mutex<Vec<(String, String)>>,
        fail_targets: Mutex<Vec<String>>,
    }

    impl MockSymlinkFileRepo {
        fn new() -> Self {
            Self {
                call_log: Mutex::new(Vec::new()),
                fail_targets: Mutex::new(Vec::new()),
            }
        }

        fn with_failures(targets: Vec<&str>) -> Self {
            Self {
                call_log: Mutex::new(Vec::new()),
                fail_targets: Mutex::new(targets.into_iter().map(String::from).collect()),
            }
        }
    }

    #[async_trait::async_trait]
    impl SymlinkFileRepository for MockSymlinkFileRepo {
        async fn create_symlink(&self, source: &str, target: &str) -> AppResult<()> {
            self.call_log
                .lock()
                .unwrap()
                .push((source.to_string(), target.to_string()));
            let fail_targets = self.fail_targets.lock().unwrap();
            if fail_targets.iter().any(|t| target.contains(t)) {
                return Err(AppError::GitOperation {
                    code: "SYMLINK_CREATE_FAILED".to_string(),
                    message: "mock failure".to_string(),
                });
            }
            Ok(())
        }
    }

    fn make_config(patterns: Vec<&str>) -> SymlinkConfig {
        SymlinkConfig {
            patterns: patterns.into_iter().map(String::from).collect(),
            source: crate::features::worktree_management::domain::SymlinkConfigSource::App,
        }
    }

    #[tokio::test]
    async fn test_empty_patterns() {
        let repo = MockSymlinkFileRepo::new();
        let service = SymlinkService::new(&repo);
        let config = make_config(vec![]);
        let result = service.execute("/main", "/new", &config).await;
        assert_eq!(result.entries.len(), 0);
        assert_eq!(result.total_created, 0);
        assert_eq!(result.total_skipped, 0);
        assert_eq!(result.total_failed, 0);
    }

    #[tokio::test]
    async fn test_no_match_returns_skipped() {
        let repo = MockSymlinkFileRepo::new();
        let service = SymlinkService::new(&repo);
        let config = make_config(vec!["nonexistent_dir_abc123"]);
        let result = service.execute("/tmp", "/new", &config).await;
        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.entries[0].status, SymlinkStatus::Skipped);
        assert_eq!(result.entries[0].matched, 0);
        assert_eq!(result.total_skipped, 1);
    }

    #[tokio::test]
    async fn test_successful_symlink_creation() {
        let tmp = std::env::temp_dir().join("buruma_test_symlink_ok");
        let _ = std::fs::remove_dir_all(&tmp);
        let main_dir = tmp.join("main");
        std::fs::create_dir_all(main_dir.join("node_modules")).unwrap();

        let repo = MockSymlinkFileRepo::new();
        let service = SymlinkService::new(&repo);
        let config = make_config(vec!["node_modules"]);
        let result = service.execute(main_dir.to_str().unwrap(), "/new_wt", &config).await;

        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.entries[0].status, SymlinkStatus::Created);
        assert_eq!(result.entries[0].matched, 1);
        assert_eq!(result.entries[0].created, 1);
        assert_eq!(result.total_created, 1);

        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[tokio::test]
    async fn test_partial_failure() {
        let tmp = std::env::temp_dir().join("buruma_test_symlink_partial");
        let _ = std::fs::remove_dir_all(&tmp);
        let main_dir = tmp.join("main");
        std::fs::create_dir_all(&main_dir).unwrap();
        std::fs::write(main_dir.join("a.cache"), "").unwrap();
        std::fs::write(main_dir.join("b.cache"), "").unwrap();

        let repo = MockSymlinkFileRepo::with_failures(vec!["b.cache"]);
        let service = SymlinkService::new(&repo);
        let config = make_config(vec!["*.cache"]);
        let result = service.execute(main_dir.to_str().unwrap(), "/new_wt", &config).await;

        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.entries[0].status, SymlinkStatus::Partial);
        assert_eq!(result.entries[0].matched, 2);
        assert_eq!(result.entries[0].created, 1);
        assert_eq!(result.entries[0].failed, 1);
        assert_eq!(result.total_created, 1);
        assert_eq!(result.total_failed, 1);

        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[tokio::test]
    async fn test_invalid_glob_pattern() {
        let repo = MockSymlinkFileRepo::new();
        let service = SymlinkService::new(&repo);
        let config = make_config(vec!["[invalid"]);
        let result = service.execute("/tmp", "/new", &config).await;
        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.entries[0].status, SymlinkStatus::Failed);
        assert!(result.entries[0].reason.is_some());
    }
}
