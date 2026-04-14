//! DefaultWorktreeGitRepository — git CLI で worktree 操作を実行。
//! 旧 TS `worktree-git-default-repository.ts` の 1:1 移植。

use std::path::Path;

use async_trait::async_trait;
use tokio::process::Command;

use crate::error::{AppError, AppResult};
use crate::features::worktree_management::application::repositories::WorktreeGitRepository;
use crate::features::worktree_management::domain::{
    BranchDeleteResult, FileChange, FileChangeStatus, WorktreeCreateParams, WorktreeInfo, WorktreeStatus,
};

pub struct DefaultWorktreeGitRepository;

#[async_trait]
impl WorktreeGitRepository for DefaultWorktreeGitRepository {
    async fn list_worktrees(&self, repo_path: &str) -> AppResult<Vec<WorktreeInfo>> {
        let raw = git_raw(repo_path, &["worktree", "list", "--porcelain"]).await?;
        let entries = parse_porcelain_output(&raw);

        let mut result = Vec::new();
        for entry in entries {
            if entry.bare {
                continue;
            }
            let head_message = git_raw(&entry.worktree, &["log", "-1", "--format=%s"])
                .await
                .map(|s| s.trim().to_string())
                .unwrap_or_default();
            let is_main = is_main_worktree(&entry.worktree).await;
            result.push(WorktreeInfo {
                path: entry.worktree,
                branch: entry.branch,
                head: entry.head.chars().take(7).collect(),
                head_message,
                is_main,
                is_dirty: false, // 後続の一括チェックで更新
            });
        }
        // 各ワークツリーの isDirty を一括チェック
        for wt in &mut result {
            wt.is_dirty = git_raw(&wt.path, &["status", "--porcelain=v1"])
                .await
                .map(|s| !s.trim().is_empty())
                .unwrap_or(false);
        }
        Ok(result)
    }

    async fn get_status(&self, worktree_path: &str) -> AppResult<WorktreeStatus> {
        let raw = git_raw(worktree_path, &["status", "--porcelain=v1"]).await?;
        let (staged, unstaged, untracked) = parse_status_output(&raw);
        let worktree = get_worktree_info_for_path(worktree_path).await?;
        Ok(WorktreeStatus {
            worktree,
            staged,
            unstaged,
            untracked,
        })
    }

    async fn add_worktree(&self, params: &WorktreeCreateParams) -> AppResult<WorktreeInfo> {
        let mut args: Vec<&str> = vec!["worktree", "add"];
        if params.create_new_branch {
            args.push("-b");
            args.push(&params.branch);
            args.push(&params.worktree_path);
            if let Some(ref sp) = params.start_point {
                args.push(sp.as_str());
            }
        } else {
            args.push(&params.worktree_path);
            args.push(&params.branch);
        }
        git_raw(&params.repo_path, &args).await?;
        get_worktree_info_for_path(&params.worktree_path).await
    }

    async fn remove_worktree(&self, worktree_path: &str, force: bool) -> AppResult<()> {
        // worktree のリポジトリルートを取得
        let common_dir = git_raw(worktree_path, &["rev-parse", "--git-common-dir"]).await?;
        let common_dir = common_dir.trim();
        let resolved = if Path::new(common_dir).is_absolute() {
            common_dir.to_string()
        } else {
            Path::new(worktree_path).join(common_dir).to_string_lossy().to_string()
        };
        let repo_root = resolved.trim_end_matches("/.git").trim_end_matches("\\.git");

        let mut args = vec!["worktree", "remove"];
        if force {
            args.push("--force");
        }
        args.push(worktree_path);
        git_raw(repo_root, &args).await?;
        Ok(())
    }

    async fn is_dirty(&self, worktree_path: &str) -> AppResult<bool> {
        let raw = git_raw(worktree_path, &["status", "--porcelain=v1"])
            .await
            .unwrap_or_default();
        Ok(!raw.trim().is_empty())
    }

    async fn get_default_branch(&self, repo_path: &str) -> AppResult<String> {
        // origin/HEAD から追跡するデフォルトブランチ取得を試行
        if let Ok(ref_str) = git_raw(repo_path, &["symbolic-ref", "refs/remotes/origin/HEAD"]).await {
            let branch = ref_str.trim().replace("refs/remotes/origin/", "");
            if !branch.is_empty() {
                return Ok(branch);
            }
        }
        // fallback: main → master
        if git_raw(repo_path, &["rev-parse", "--verify", "refs/heads/main"])
            .await
            .is_ok()
        {
            return Ok("main".to_string());
        }
        if git_raw(repo_path, &["rev-parse", "--verify", "refs/heads/master"])
            .await
            .is_ok()
        {
            return Ok("master".to_string());
        }
        Ok("main".to_string())
    }

    async fn is_main_worktree(&self, worktree_path: &str) -> AppResult<bool> {
        Ok(is_main_worktree(worktree_path).await)
    }

    async fn get_main_worktree_path(&self, repo_path: &str) -> AppResult<String> {
        let common_dir = git_raw(repo_path, &["rev-parse", "--git-common-dir"]).await?;
        let common_dir = common_dir.trim();
        let resolved = if Path::new(common_dir).is_absolute() {
            common_dir.to_string()
        } else {
            Path::new(repo_path).join(common_dir).to_string_lossy().to_string()
        };
        let main_path = resolved.trim_end_matches("/.git").trim_end_matches("\\.git");
        Ok(main_path.to_string())
    }

    async fn delete_branch(&self, repo_path: &str, branch: &str, force: bool) -> AppResult<BranchDeleteResult> {
        let flag = if force { "-D" } else { "-d" };
        let output = Command::new("git")
            .args(["-C", repo_path, "branch", flag, branch])
            .output()
            .await
            .map_err(|e| AppError::GitError(format!("git branch {flag} failed: {e}")))?;

        if output.status.success() {
            return Ok(BranchDeleteResult::Deleted {
                branch_name: branch.to_string(),
            });
        }

        let stderr = String::from_utf8_lossy(&output.stderr);
        // 未マージブランチの場合、git branch -d は "not fully merged" を含むエラーを返す
        if !force && stderr.contains("not fully merged") {
            return Ok(BranchDeleteResult::RequireForce {
                branch_name: branch.to_string(),
            });
        }

        Err(AppError::GitError(stderr.trim().to_string()))
    }

    async fn suggest_path(&self, repo_path: &str, branch: &str) -> AppResult<String> {
        let worktrees = self.list_worktrees(repo_path).await?;
        let main_wt = worktrees.iter().find(|wt| wt.is_main);
        let base_path = main_wt.map(|wt| wt.path.as_str()).unwrap_or(repo_path);

        let parent = Path::new(base_path).parent().unwrap_or(Path::new(base_path));
        let repo_name = Path::new(base_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("repo");
        let sanitized = branch.replace(|c: char| "/\\:*?\"<>|".contains(c), "-");
        Ok(parent
            .join(format!("{repo_name}+{sanitized}"))
            .to_string_lossy()
            .to_string())
    }
}

// --- git CLI ヘルパー ---

async fn git_raw(cwd: &str, args: &[&str]) -> AppResult<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .await
        .map_err(|e| AppError::GitError(format!("git command failed: {e}")))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::GitError(stderr.trim().to_string()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

async fn is_main_worktree(worktree_path: &str) -> bool {
    git_raw(worktree_path, &["rev-parse", "--git-dir"])
        .await
        .map(|s| s.trim() == ".git")
        .unwrap_or(false)
}

async fn get_worktree_info_for_path(worktree_path: &str) -> AppResult<WorktreeInfo> {
    let mut branch: Option<String> = None;
    if let Ok(b) = git_raw(worktree_path, &["rev-parse", "--abbrev-ref", "HEAD"]).await {
        let b = b.trim().to_string();
        branch = if b == "HEAD" { None } else { Some(b) };
    }
    let head = git_raw(worktree_path, &["rev-parse", "--short", "HEAD"])
        .await
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    let head_message = git_raw(worktree_path, &["log", "-1", "--format=%s"])
        .await
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    let is_main = is_main_worktree(worktree_path).await;
    let is_dirty = git_raw(worktree_path, &["status", "--porcelain=v1"])
        .await
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);

    Ok(WorktreeInfo {
        path: worktree_path.to_string(),
        branch,
        head,
        head_message,
        is_main,
        is_dirty,
    })
}

// --- パーサー (旧 TS parsePorcelainOutput / parseStatusLine の 1:1 移植) ---

struct PorcelainEntry {
    worktree: String,
    head: String,
    branch: Option<String>,
    bare: bool,
}

fn parse_porcelain_output(raw: &str) -> Vec<PorcelainEntry> {
    let mut entries = Vec::new();
    let mut worktree = String::new();
    let mut head = String::new();
    let mut branch: Option<String> = None;
    let mut bare = false;

    for line in raw.lines() {
        if line.is_empty() {
            if !worktree.is_empty() && !head.is_empty() {
                entries.push(PorcelainEntry {
                    worktree: worktree.clone(),
                    head: head.clone(),
                    branch: branch.take(),
                    bare,
                });
            }
            worktree.clear();
            head.clear();
            branch = None;
            bare = false;
            continue;
        }

        if let Some(val) = line.strip_prefix("worktree ") {
            worktree = val.to_string();
        } else if let Some(val) = line.strip_prefix("HEAD ") {
            head = val.to_string();
        } else if let Some(val) = line.strip_prefix("branch ") {
            branch = Some(val.replace("refs/heads/", ""));
        } else if line == "bare" {
            bare = true;
        } else if line == "detached" {
            branch = None;
        }
    }
    // 末尾に空行がない場合
    if !worktree.is_empty() && !head.is_empty() {
        entries.push(PorcelainEntry {
            worktree,
            head,
            branch,
            bare,
        });
    }
    entries
}

fn to_file_change_status(code: char) -> FileChangeStatus {
    match code {
        'A' => FileChangeStatus::Added,
        'D' => FileChangeStatus::Deleted,
        'R' => FileChangeStatus::Renamed,
        'C' => FileChangeStatus::Copied,
        _ => FileChangeStatus::Modified,
    }
}

fn parse_status_output(raw: &str) -> (Vec<FileChange>, Vec<FileChange>, Vec<String>) {
    let mut staged = Vec::new();
    let mut unstaged = Vec::new();
    let mut untracked = Vec::new();

    for line in raw.lines() {
        if line.len() < 4 {
            continue;
        }
        let bytes = line.as_bytes();
        let index = bytes[0] as char;
        let work_tree = bytes[1] as char;
        let path = &line[3..];

        if index == '?' && work_tree == '?' {
            untracked.push(path.to_string());
            continue;
        }
        if index != ' ' && index != '?' {
            staged.push(FileChange {
                path: path.to_string(),
                status: to_file_change_status(index),
                old_path: None,
            });
        }
        if work_tree != ' ' && work_tree != '?' {
            unstaged.push(FileChange {
                path: path.to_string(),
                status: to_file_change_status(work_tree),
                old_path: None,
            });
        }
    }
    (staged, unstaged, untracked)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_porcelain_output() {
        let raw = "worktree /path/to/main\nHEAD abc1234\nbranch refs/heads/main\n\nworktree /path/to/feature\nHEAD def5678\nbranch refs/heads/feature/test\n\n";
        let entries = parse_porcelain_output(raw);
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].worktree, "/path/to/main");
        assert_eq!(entries[0].branch, Some("main".to_string()));
        assert_eq!(entries[1].branch, Some("feature/test".to_string()));
    }

    #[test]
    fn test_parse_porcelain_detached() {
        let raw = "worktree /path/to/wt\nHEAD abc1234\ndetached\n\n";
        let entries = parse_porcelain_output(raw);
        assert_eq!(entries.len(), 1);
        assert!(entries[0].branch.is_none());
    }

    #[test]
    fn test_parse_porcelain_bare() {
        let raw = "worktree /path/to/bare\nHEAD abc1234\nbare\n\n";
        let entries = parse_porcelain_output(raw);
        assert_eq!(entries.len(), 1);
        assert!(entries[0].bare);
    }

    #[test]
    fn test_parse_status_output() {
        let raw = "M  src/main.rs\n?? new_file.txt\nAM staged_and_modified.rs\n";
        let (staged, unstaged, untracked) = parse_status_output(raw);
        assert_eq!(staged.len(), 2); // M + A
        assert_eq!(unstaged.len(), 1); // M (from AM)
        assert_eq!(untracked.len(), 1);
        assert_eq!(untracked[0], "new_file.txt");
    }

    #[test]
    fn test_to_file_change_status() {
        assert_eq!(to_file_change_status('A'), FileChangeStatus::Added);
        assert_eq!(to_file_change_status('D'), FileChangeStatus::Deleted);
        assert_eq!(to_file_change_status('R'), FileChangeStatus::Renamed);
        assert_eq!(to_file_change_status('C'), FileChangeStatus::Copied);
        // M やマッチしない文字は Modified にフォールバック
        assert_eq!(to_file_change_status('M'), FileChangeStatus::Modified);
        assert_eq!(to_file_change_status('?'), FileChangeStatus::Modified);
    }

    #[test]
    fn test_parse_porcelain_no_trailing_newline() {
        let raw = "worktree /path/to/main\nHEAD abc1234\nbranch refs/heads/main";
        let entries = parse_porcelain_output(raw);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].worktree, "/path/to/main");
        assert_eq!(entries[0].branch, Some("main".to_string()));
    }

    #[test]
    fn test_parse_porcelain_empty() {
        let entries = parse_porcelain_output("");
        assert!(entries.is_empty());
    }
}
