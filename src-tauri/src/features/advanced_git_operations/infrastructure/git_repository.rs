//! DefaultGitAdvancedRepository — 高度な git 操作の CLI ラッパー。
//! TypeScript 側 `git-advanced-default-repository.ts` の 1:1 移植。

use std::path::Path;

use async_trait::async_trait;
use tokio::process::Command;

use crate::error::{AppError, AppResult};
use crate::features::advanced_git_operations::application::repositories::GitAdvancedRepository;
use crate::features::advanced_git_operations::domain::{
    CherryPickOptions, CherryPickResult, CherryPickResultStatus, ConflictFile, ConflictFileStatus,
    ConflictResolution, ConflictResolveAllOptions, ConflictResolveOptions, ConflictType,
    InteractiveRebaseOptions, MergeOptions, MergeResult, MergeResultStatus, MergeStatus,
    MergeStrategy, RebaseAction, RebaseOptions, RebaseResult, RebaseResultStatus, RebaseStep,
    StashEntry, StashSaveOptions, TagCreateOptions, TagInfo, TagType, ThreeWayContent,
};
use crate::git::command::{raw, raw_or_empty};

pub struct DefaultGitAdvancedRepository;

#[async_trait]
impl GitAdvancedRepository for DefaultGitAdvancedRepository {
    // --- Merge ---

    async fn merge(&self, options: &MergeOptions) -> AppResult<MergeResult> {
        let strategy_flag = match options.strategy {
            MergeStrategy::FastForward => "--ff-only",
            MergeStrategy::NoFf => "--no-ff",
        };
        match git_raw_with_stderr(
            &options.worktree_path,
            &["merge", strategy_flag, &options.branch],
        )
        .await
        {
            Ok(_) => Ok(MergeResult {
                status: MergeResultStatus::Success,
                conflict_files: None,
                merge_commit: None,
            }),
            Err(stderr) => {
                if stderr.contains("Already up to date") || stderr.contains("Already up-to-date") {
                    Ok(MergeResult {
                        status: MergeResultStatus::AlreadyUpToDate,
                        conflict_files: None,
                        merge_commit: None,
                    })
                } else if stderr.contains("CONFLICT") || stderr.contains("Merge conflict") {
                    let conflicts = get_conflicted_files(&options.worktree_path).await;
                    Ok(MergeResult {
                        status: MergeResultStatus::Conflict,
                        conflict_files: Some(conflicts),
                        merge_commit: None,
                    })
                } else {
                    Err(AppError::GitOperation {
                        code: "MERGE_FAILED".to_string(),
                        message: stderr,
                    })
                }
            }
        }
    }

    async fn merge_abort(&self, worktree_path: &str) -> AppResult<()> {
        raw(worktree_path, &["merge", "--abort"]).await?;
        Ok(())
    }

    async fn merge_status(&self, worktree_path: &str) -> AppResult<MergeStatus> {
        match raw(worktree_path, &["rev-parse", "--verify", "MERGE_HEAD"]).await {
            Ok(_) => {
                let conflicts = get_conflicted_files(worktree_path).await;
                Ok(MergeStatus {
                    is_merging: true,
                    branch: None,
                    conflict_files: if conflicts.is_empty() {
                        None
                    } else {
                        Some(conflicts)
                    },
                })
            }
            Err(_) => Ok(MergeStatus {
                is_merging: false,
                branch: None,
                conflict_files: None,
            }),
        }
    }

    // --- Rebase ---

    async fn rebase(&self, options: &RebaseOptions) -> AppResult<RebaseResult> {
        match git_raw_with_stderr(&options.worktree_path, &["rebase", &options.onto]).await {
            Ok(_) => Ok(RebaseResult {
                status: RebaseResultStatus::Success,
                conflict_files: None,
                current_step: None,
                total_steps: None,
            }),
            Err(stderr) => {
                if stderr.contains("CONFLICT") || stderr.contains("could not apply") {
                    let conflicts = get_conflicted_files(&options.worktree_path).await;
                    Ok(RebaseResult {
                        status: RebaseResultStatus::Conflict,
                        conflict_files: Some(conflicts),
                        current_step: None,
                        total_steps: None,
                    })
                } else {
                    Err(AppError::GitOperation {
                        code: "REBASE_FAILED".to_string(),
                        message: stderr,
                    })
                }
            }
        }
    }

    async fn rebase_interactive(
        &self,
        options: &InteractiveRebaseOptions,
    ) -> AppResult<RebaseResult> {
        let git_dir = Path::new(&options.worktree_path).join(".git");
        let todo_file = git_dir.join("rebase-todo-tmp");

        // todo ファイルを作成
        let mut steps = options.steps.clone();
        steps.sort_by_key(|s| s.order);
        let todo_content: String = steps
            .iter()
            .map(|s| format!("{} {} {}", s.action.as_str(), s.hash, s.message))
            .collect::<Vec<_>>()
            .join("\n");

        tokio::fs::write(&todo_file, &todo_content)
            .await
            .map_err(AppError::Io)?;

        let editor_script = format!("cp \"{}\"", todo_file.display());
        let result = Command::new("git")
            .args(["rebase", "-i", &options.onto])
            .current_dir(&options.worktree_path)
            .env("GIT_SEQUENCE_EDITOR", &editor_script)
            .output()
            .await
            .map_err(|e| AppError::GitError(format!("git rebase -i failed: {e}")))?;

        // クリーンアップ
        let _ = tokio::fs::remove_file(&todo_file).await;

        if result.status.success() {
            Ok(RebaseResult {
                status: RebaseResultStatus::Success,
                conflict_files: None,
                current_step: None,
                total_steps: None,
            })
        } else {
            let stderr = String::from_utf8_lossy(&result.stderr).to_string();
            if stderr.contains("CONFLICT") || stderr.contains("could not apply") {
                let conflicts = get_conflicted_files(&options.worktree_path).await;
                Ok(RebaseResult {
                    status: RebaseResultStatus::Conflict,
                    conflict_files: Some(conflicts),
                    current_step: None,
                    total_steps: None,
                })
            } else {
                Err(AppError::GitOperation {
                    code: "REBASE_FAILED".to_string(),
                    message: stderr.trim().to_string(),
                })
            }
        }
    }

    async fn rebase_abort(&self, worktree_path: &str) -> AppResult<()> {
        raw(worktree_path, &["rebase", "--abort"]).await?;
        Ok(())
    }

    async fn rebase_continue(&self, worktree_path: &str) -> AppResult<RebaseResult> {
        match git_raw_with_stderr(worktree_path, &["rebase", "--continue"]).await {
            Ok(_) => Ok(RebaseResult {
                status: RebaseResultStatus::Success,
                conflict_files: None,
                current_step: None,
                total_steps: None,
            }),
            Err(stderr) => {
                if stderr.contains("CONFLICT") || stderr.contains("could not apply") {
                    let conflicts = get_conflicted_files(worktree_path).await;
                    Ok(RebaseResult {
                        status: RebaseResultStatus::Conflict,
                        conflict_files: Some(conflicts),
                        current_step: None,
                        total_steps: None,
                    })
                } else {
                    Err(AppError::GitOperation {
                        code: "REBASE_CONTINUE_FAILED".to_string(),
                        message: stderr,
                    })
                }
            }
        }
    }

    async fn rebase_get_commits(
        &self,
        worktree_path: &str,
        onto: &str,
    ) -> AppResult<Vec<RebaseStep>> {
        let range = format!("{onto}..HEAD");
        let output = raw(
            worktree_path,
            &["log", "--format=%H%n%s", "--reverse", &range],
        )
        .await?;
        let lines: Vec<&str> = output.lines().collect();
        let mut steps = Vec::new();
        let mut i = 0;
        let mut order = 0u32;
        while i + 1 < lines.len() {
            steps.push(RebaseStep {
                hash: lines[i].to_string(),
                message: lines[i + 1].to_string(),
                action: RebaseAction::Pick,
                order,
            });
            order += 1;
            i += 2;
        }
        Ok(steps)
    }

    // --- Stash ---

    async fn stash_save(&self, options: &StashSaveOptions) -> AppResult<()> {
        let mut args: Vec<&str> = vec!["stash", "push"];
        let msg_owned;
        if let Some(ref message) = options.message {
            args.push("-m");
            msg_owned = message.clone();
            args.push(&msg_owned);
        }
        if options.include_untracked.unwrap_or(false) {
            args.push("--include-untracked");
        }
        raw(&options.worktree_path, &args).await?;
        Ok(())
    }

    async fn stash_list(&self, worktree_path: &str) -> AppResult<Vec<StashEntry>> {
        let output = raw(
            worktree_path,
            &["stash", "list", "--format=%H%n%s%n%aI%n%gd"],
        )
        .await?;
        Ok(parse_stash_list(&output))
    }

    async fn stash_pop(&self, worktree_path: &str, index: u32) -> AppResult<()> {
        let ref_str = format!("stash@{{{index}}}");
        raw(worktree_path, &["stash", "pop", &ref_str]).await?;
        Ok(())
    }

    async fn stash_apply(&self, worktree_path: &str, index: u32) -> AppResult<()> {
        let ref_str = format!("stash@{{{index}}}");
        raw(worktree_path, &["stash", "apply", &ref_str]).await?;
        Ok(())
    }

    async fn stash_drop(&self, worktree_path: &str, index: u32) -> AppResult<()> {
        let ref_str = format!("stash@{{{index}}}");
        raw(worktree_path, &["stash", "drop", &ref_str]).await?;
        Ok(())
    }

    async fn stash_clear(&self, worktree_path: &str) -> AppResult<()> {
        raw(worktree_path, &["stash", "clear"]).await?;
        Ok(())
    }

    // --- Cherry-pick ---

    async fn cherry_pick(&self, options: &CherryPickOptions) -> AppResult<CherryPickResult> {
        let mut applied = Vec::new();
        for commit in &options.commits {
            match git_raw_with_stderr(&options.worktree_path, &["cherry-pick", commit]).await {
                Ok(_) => applied.push(commit.clone()),
                Err(stderr) => {
                    if stderr.contains("CONFLICT") || stderr.contains("could not apply") {
                        let conflicts = get_conflicted_files(&options.worktree_path).await;
                        return Ok(CherryPickResult {
                            status: CherryPickResultStatus::Conflict,
                            conflict_files: Some(conflicts),
                            applied_commits: applied,
                        });
                    }
                    return Err(AppError::GitOperation {
                        code: "CHERRY_PICK_FAILED".to_string(),
                        message: stderr,
                    });
                }
            }
        }
        Ok(CherryPickResult {
            status: CherryPickResultStatus::Success,
            conflict_files: None,
            applied_commits: applied,
        })
    }

    async fn cherry_pick_abort(&self, worktree_path: &str) -> AppResult<()> {
        raw(worktree_path, &["cherry-pick", "--abort"]).await?;
        Ok(())
    }

    // --- Conflict ---

    async fn conflict_list(&self, worktree_path: &str) -> AppResult<Vec<ConflictFile>> {
        let output = raw(worktree_path, &["status", "--porcelain=v1"]).await?;
        let files: Vec<ConflictFile> = output
            .lines()
            .filter(|line| {
                if line.len() < 3 {
                    return false;
                }
                let bytes = line.as_bytes();
                let x = bytes[0];
                let y = bytes[1];
                // UU, AA, DD, AU, UA, DU, UD = conflict markers
                matches!(
                    (x, y),
                    (b'U', b'U')
                        | (b'A', b'A')
                        | (b'D', b'D')
                        | (b'A', b'U')
                        | (b'U', b'A')
                        | (b'D', b'U')
                        | (b'U', b'D')
                )
            })
            .map(|line| ConflictFile {
                file_path: line[3..].to_string(),
                status: ConflictFileStatus::Conflicted,
                conflict_type: ConflictType::Content,
            })
            .collect();
        Ok(files)
    }

    async fn conflict_file_content(
        &self,
        worktree_path: &str,
        file_path: &str,
    ) -> AppResult<ThreeWayContent> {
        let base = raw_or_empty(worktree_path, &["show", &format!(":1:{file_path}")]).await;
        let ours = raw_or_empty(worktree_path, &["show", &format!(":2:{file_path}")]).await;
        let theirs = raw_or_empty(worktree_path, &["show", &format!(":3:{file_path}")]).await;

        // merged = 作業ツリーのファイル
        let merged_path = Path::new(worktree_path).join(file_path);
        let merged = tokio::fs::read_to_string(&merged_path)
            .await
            .unwrap_or_default();

        Ok(ThreeWayContent {
            base,
            ours,
            theirs,
            merged,
        })
    }

    async fn conflict_resolve(&self, options: &ConflictResolveOptions) -> AppResult<()> {
        match &options.resolution {
            ConflictResolution::Ours => {
                raw(
                    &options.worktree_path,
                    &["checkout", "--ours", &options.file_path],
                )
                .await?;
            }
            ConflictResolution::Theirs => {
                raw(
                    &options.worktree_path,
                    &["checkout", "--theirs", &options.file_path],
                )
                .await?;
            }
            ConflictResolution::Manual { content } => {
                let base = tokio::fs::canonicalize(&options.worktree_path)
                    .await
                    .map_err(AppError::Io)?;
                let target = base.join(&options.file_path);
                let resolved = tokio::fs::canonicalize(&target)
                    .await
                    .unwrap_or(target.clone());
                if !resolved.starts_with(&base) {
                    return Err(AppError::Internal("path traversal detected".to_string()));
                }
                tokio::fs::write(&resolved, content)
                    .await
                    .map_err(AppError::Io)?;
            }
        }
        raw(&options.worktree_path, &["add", &options.file_path]).await?;
        Ok(())
    }

    async fn conflict_resolve_all(&self, options: &ConflictResolveAllOptions) -> AppResult<()> {
        let conflicts = self.conflict_list(&options.worktree_path).await?;
        let strategy_flag = match options.strategy {
            crate::features::advanced_git_operations::domain::ConflictResolveAllStrategy::Ours => {
                "--ours"
            }
            crate::features::advanced_git_operations::domain::ConflictResolveAllStrategy::Theirs => {
                "--theirs"
            }
        };
        for file in &conflicts {
            raw(
                &options.worktree_path,
                &["checkout", strategy_flag, &file.file_path],
            )
            .await?;
            raw(&options.worktree_path, &["add", &file.file_path]).await?;
        }
        Ok(())
    }

    async fn conflict_mark_resolved(&self, worktree_path: &str, file_path: &str) -> AppResult<()> {
        raw(worktree_path, &["add", file_path]).await?;
        Ok(())
    }

    // --- Tag ---

    async fn tag_list(&self, worktree_path: &str) -> AppResult<Vec<TagInfo>> {
        let tags_raw = raw(worktree_path, &["tag", "-l"]).await?;
        let tag_names: Vec<&str> = tags_raw.lines().filter(|l| !l.is_empty()).collect();
        let mut tags = Vec::new();

        for tag_name in tag_names {
            let info_raw = raw(
                worktree_path,
                &[
                    "tag",
                    "-l",
                    "--format=%(objecttype)\t%(creatordate:iso)\t%(contents:subject)\t%(taggername)",
                    tag_name,
                ],
            )
            .await
            .unwrap_or_default();

            let hash = raw(worktree_path, &["rev-list", "-1", tag_name])
                .await
                .map(|s| s.trim().to_string())
                .unwrap_or_default();

            let parts: Vec<&str> = info_raw.trim().splitn(4, '\t').collect();
            let is_annotated = parts.first().map(|s| *s == "tag").unwrap_or(false);

            tags.push(TagInfo {
                name: tag_name.to_string(),
                hash,
                date: parts.get(1).unwrap_or(&"").to_string(),
                tag_type: if is_annotated {
                    TagType::Annotated
                } else {
                    TagType::Lightweight
                },
                message: if is_annotated {
                    parts
                        .get(2)
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string())
                } else {
                    None
                },
                tagger: if is_annotated {
                    parts
                        .get(3)
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string())
                } else {
                    None
                },
            });
        }

        Ok(tags)
    }

    async fn tag_create(&self, options: &TagCreateOptions) -> AppResult<()> {
        let target = options.commit_hash.as_deref().unwrap_or("HEAD");
        match options.tag_type {
            TagType::Annotated => {
                let message = options.message.as_deref().unwrap_or("");
                raw(
                    &options.worktree_path,
                    &["tag", "-a", &options.tag_name, "-m", message, target],
                )
                .await?;
            }
            TagType::Lightweight => {
                raw(&options.worktree_path, &["tag", &options.tag_name, target]).await?;
            }
        }
        Ok(())
    }

    async fn tag_delete(&self, worktree_path: &str, tag_name: &str) -> AppResult<()> {
        raw(worktree_path, &["tag", "-d", tag_name]).await?;
        Ok(())
    }
}

// --- ヘルパー ---

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
        Err(format!("{}\n{}", stdout.trim(), stderr.trim())
            .trim()
            .to_string())
    }
}

/// `git status --porcelain=v1` から conflicted ファイル一覧を取得。
async fn get_conflicted_files(worktree_path: &str) -> Vec<String> {
    let output = raw(worktree_path, &["status", "--porcelain=v1"])
        .await
        .unwrap_or_default();
    output
        .lines()
        .filter(|line| {
            if line.len() < 3 {
                return false;
            }
            let bytes = line.as_bytes();
            matches!(
                (bytes[0], bytes[1]),
                (b'U', b'U')
                    | (b'A', b'A')
                    | (b'D', b'D')
                    | (b'A', b'U')
                    | (b'U', b'A')
                    | (b'D', b'U')
                    | (b'U', b'D')
            )
        })
        .map(|line| line[3..].to_string())
        .collect()
}

fn parse_stash_list(output: &str) -> Vec<StashEntry> {
    let lines: Vec<&str> = output.lines().collect();
    let mut entries = Vec::new();
    let mut i = 0;
    let mut index = 0u32;
    while i + 3 < lines.len() {
        entries.push(StashEntry {
            index,
            hash: lines[i].to_string(),
            message: lines[i + 1].to_string(),
            date: lines[i + 2].to_string(),
            branch: lines[i + 3].to_string(),
        });
        index += 1;
        i += 4;
    }
    entries
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_stash_list() {
        let output = "abc123\nWIP on main: fix something\n2026-04-10T12:00:00+09:00\nstash@{0}\n";
        let entries = parse_stash_list(output);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].hash, "abc123");
        assert_eq!(entries[0].message, "WIP on main: fix something");
        assert_eq!(entries[0].index, 0);
    }

    #[test]
    fn test_parse_stash_list_empty() {
        assert!(parse_stash_list("").is_empty());
    }
}
