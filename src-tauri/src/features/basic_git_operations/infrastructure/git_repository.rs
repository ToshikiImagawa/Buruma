//! DefaultGitWriteRepository — git 書き込み操作の CLI ラッパー。
//! TypeScript 側 `git-write-default-repository.ts` の 1:1 移植。

use async_trait::async_trait;
use tokio::process::Command;

use crate::error::{AppError, AppResult};
use crate::features::basic_git_operations::application::repositories::GitWriteRepository;
use crate::features::basic_git_operations::domain::{
    BranchCheckoutArgs, BranchCreateArgs, BranchDeleteArgs, CommitArgs, CommitResult, FetchArgs, FetchResult, PullArgs,
    PullResult, PullSummary, PushArgs, PushResult, ResetArgs,
};
use crate::git::command::raw;

pub struct DefaultGitWriteRepository;

#[async_trait]
impl GitWriteRepository for DefaultGitWriteRepository {
    async fn stage(&self, worktree_path: &str, files: &[String]) -> AppResult<()> {
        let mut args: Vec<&str> = vec!["add"];
        let files_ref: Vec<&str> = files.iter().map(|s| s.as_str()).collect();
        args.extend(&files_ref);
        raw(worktree_path, &args).await?;
        Ok(())
    }

    async fn stage_all(&self, worktree_path: &str) -> AppResult<()> {
        raw(worktree_path, &["add", "-A"]).await?;
        Ok(())
    }

    async fn unstage(&self, worktree_path: &str, files: &[String]) -> AppResult<()> {
        let mut args: Vec<&str> = vec!["reset", "--"];
        let files_ref: Vec<&str> = files.iter().map(|s| s.as_str()).collect();
        args.extend(&files_ref);
        raw(worktree_path, &args).await?;
        Ok(())
    }

    async fn unstage_all(&self, worktree_path: &str) -> AppResult<()> {
        raw(worktree_path, &["reset"]).await?;
        Ok(())
    }

    async fn commit(&self, args: &CommitArgs) -> AppResult<CommitResult> {
        let mut cmd_args: Vec<&str> = vec!["commit", "-m", &args.message];
        if args.amend.unwrap_or(false) {
            cmd_args.push("--amend");
        }
        raw(&args.worktree_path, &cmd_args).await?;

        // コミット情報を取得
        let log_raw = raw(&args.worktree_path, &["log", "-1", "--format=%H%n%an%n%aI"]).await?;
        let lines: Vec<&str> = log_raw.lines().collect();

        Ok(CommitResult {
            hash: lines.first().unwrap_or(&"").to_string(),
            message: args.message.clone(),
            author: lines.get(1).unwrap_or(&"").to_string(),
            date: lines.get(2).unwrap_or(&"").to_string(),
        })
    }

    async fn push(&self, args: &PushArgs) -> AppResult<PushResult> {
        let remote = args.remote.as_deref().unwrap_or("origin");
        let set_upstream = args.set_upstream.unwrap_or(false);

        let mut cmd_args: Vec<String> = vec!["push".to_string()];
        if set_upstream {
            cmd_args.push("-u".to_string());
        }
        cmd_args.push(remote.to_string());

        if let Some(ref branch) = args.branch {
            cmd_args.push(branch.clone());
        } else if set_upstream {
            // setUpstream 時はブランチ名を明示的に取得して渡す
            let current_branch = raw(&args.worktree_path, &["rev-parse", "--abbrev-ref", "HEAD"])
                .await
                .map(|s| s.trim().to_string())
                .unwrap_or_default();
            if !current_branch.is_empty() {
                cmd_args.push(current_branch);
            }
        }

        let refs: Vec<&str> = cmd_args.iter().map(|s| s.as_str()).collect();
        match git_raw_with_stderr(&args.worktree_path, &refs).await {
            Ok((stdout, _stderr)) => Ok(PushResult {
                remote: remote.to_string(),
                branch: args.branch.clone().unwrap_or_default(),
                success: true,
                up_to_date: stdout.contains("Everything up-to-date"),
            }),
            Err(stderr) => {
                if stderr.contains("no upstream") || stderr.contains("--set-upstream") {
                    Err(AppError::GitOperation {
                        code: "NO_UPSTREAM".to_string(),
                        message: "upstream が設定されていません。--set-upstream を使用してください。".to_string(),
                    })
                } else if stderr.contains("rejected") || stderr.contains("[rejected]") {
                    Err(AppError::GitOperation {
                        code: "PUSH_REJECTED".to_string(),
                        message: "プッシュが拒否されました。先にプルしてください。".to_string(),
                    })
                } else {
                    Err(AppError::GitError(stderr))
                }
            }
        }
    }

    async fn pull(&self, args: &PullArgs) -> AppResult<PullResult> {
        let remote = args.remote.as_deref().unwrap_or("origin");

        let mut cmd_args: Vec<&str> = vec!["pull", remote];
        let branch_owned;
        if let Some(ref branch) = args.branch {
            branch_owned = branch.clone();
            cmd_args.push(&branch_owned);
        }

        match git_raw_with_stderr(&args.worktree_path, &cmd_args).await {
            Ok((stdout, _stderr)) => {
                let summary = parse_pull_summary(&stdout);
                Ok(PullResult {
                    remote: remote.to_string(),
                    branch: args.branch.clone().unwrap_or_default(),
                    summary,
                    conflicts: Vec::new(),
                })
            }
            Err(stderr) => {
                if stderr.contains("CONFLICT") || stderr.contains("conflict") {
                    Err(AppError::GitOperation {
                        code: "PULL_CONFLICT".to_string(),
                        message: "プル時にコンフリクトが発生しました。".to_string(),
                    })
                } else {
                    Err(AppError::GitError(stderr))
                }
            }
        }
    }

    async fn fetch(&self, args: &FetchArgs) -> AppResult<FetchResult> {
        let remote = args.remote.as_deref().unwrap_or("--all");
        if args.remote.is_some() {
            raw(&args.worktree_path, &["fetch", remote]).await?;
        } else {
            raw(&args.worktree_path, &["fetch", "--all"]).await?;
        }
        Ok(FetchResult {
            remote: remote.to_string(),
        })
    }

    async fn branch_create(&self, args: &BranchCreateArgs) -> AppResult<()> {
        let mut cmd_args: Vec<&str> = vec!["branch", &args.name];
        if let Some(ref start_point) = args.start_point {
            cmd_args.push(start_point);
        }
        raw(&args.worktree_path, &cmd_args).await?;
        Ok(())
    }

    async fn branch_checkout(&self, args: &BranchCheckoutArgs) -> AppResult<()> {
        raw(&args.worktree_path, &["checkout", &args.branch]).await?;
        Ok(())
    }

    async fn branch_delete(&self, args: &BranchDeleteArgs) -> AppResult<()> {
        if args.remote.unwrap_or(false) {
            match git_raw_with_stderr(&args.worktree_path, &["push", "origin", "--delete", &args.branch]).await {
                Ok(_) => Ok(()),
                Err(stderr) => Err(AppError::GitError(stderr)),
            }
        } else {
            let flag = if args.force.unwrap_or(false) { "-D" } else { "-d" };
            match git_raw_with_stderr(&args.worktree_path, &["branch", flag, &args.branch]).await {
                Ok(_) => Ok(()),
                Err(stderr) => {
                    if stderr.contains("not fully merged") {
                        Err(AppError::GitOperation {
                            code: "BRANCH_NOT_MERGED".to_string(),
                            message: format!("ブランチ '{}' はマージされていません", args.branch),
                        })
                    } else {
                        Err(AppError::GitError(stderr))
                    }
                }
            }
        }
    }

    async fn reset(&self, args: &ResetArgs) -> AppResult<()> {
        raw(&args.worktree_path, &["reset", args.mode.as_flag(), &args.target]).await?;
        Ok(())
    }
}

// --- ヘルパー ---

/// git コマンドを実行し、成功時は (stdout, stderr)、失敗時は stderr を返す。
/// push/pull 等は stderr にも有用な情報を出力するため、raw() とは別に用意。
async fn git_raw_with_stderr(cwd: &str, args: &[&str]) -> Result<(String, String), String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .await
        .map_err(|e| format!("git command failed: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok((stdout, stderr))
    } else {
        Err(stderr.trim().to_string())
    }
}

/// git pull の出力から changes/insertions/deletions をパースする。
fn parse_pull_summary(output: &str) -> PullSummary {
    let mut changes = 0u32;
    let mut insertions = 0u32;
    let mut deletions = 0u32;

    for line in output.lines() {
        // "X files changed, Y insertions(+), Z deletions(-)"
        if line.contains("changed") {
            for part in line.split(',') {
                let part = part.trim();
                if part.contains("file") && part.contains("changed") {
                    if let Some(n) = part.split_whitespace().next().and_then(|s| s.parse().ok()) {
                        changes = n;
                    }
                } else if part.contains("insertion") {
                    if let Some(n) = part.split_whitespace().next().and_then(|s| s.parse().ok()) {
                        insertions = n;
                    }
                } else if part.contains("deletion") {
                    if let Some(n) = part.split_whitespace().next().and_then(|s| s.parse().ok()) {
                        deletions = n;
                    }
                }
            }
        }
    }

    PullSummary {
        changes,
        insertions,
        deletions,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_pull_summary() {
        let output = " 3 files changed, 10 insertions(+), 5 deletions(-)";
        let summary = parse_pull_summary(output);
        assert_eq!(summary.changes, 3);
        assert_eq!(summary.insertions, 10);
        assert_eq!(summary.deletions, 5);
    }

    #[test]
    fn test_parse_pull_summary_empty() {
        let summary = parse_pull_summary("Already up to date.");
        assert_eq!(summary.changes, 0);
        assert_eq!(summary.insertions, 0);
        assert_eq!(summary.deletions, 0);
    }
}
