//! DefaultGitReadRepository — git CLI ラッパー。
//! TypeScript 側 `git-read-default-repository.ts` + `diff-parser.ts` + `file-tree-builder.ts` の 1:1 移植。

use std::path::Path;

use async_trait::async_trait;

use crate::error::{AppError, AppResult};
use crate::features::repository_viewer::application::repositories::GitReadRepository;
use crate::features::repository_viewer::domain::{
    BranchInfo, BranchList, CommitDetail, CommitFileChange, FileContents, FileDiff, FileTreeNode,
    FileTreeNodeType, GitLogQuery, GitLogResult, GitStatus,
};
use crate::features::worktree_management::domain::{FileChange, FileChangeStatus};
use crate::git::command::{raw, raw_or_empty};
use crate::git::diff_parser::parse_diff_output;
use crate::git::log_parser::parse_log_output;

pub struct DefaultGitReadRepository;

#[async_trait]
impl GitReadRepository for DefaultGitReadRepository {
    async fn get_status(&self, worktree_path: &str) -> AppResult<GitStatus> {
        let output = raw(worktree_path, &["status", "--porcelain=v1"]).await?;
        Ok(parse_status_output(&output))
    }

    async fn get_log(&self, query: &GitLogQuery) -> AppResult<GitLogResult> {
        let max_count_arg = format!("--max-count={}", query.limit);
        let skip_arg = format!("--skip={}", query.offset);

        let mut args = vec![
            "log",
            "--all",
            &max_count_arg,
            &skip_arg,
            "--format=%H%n%h%n%s%n%an%n%ae%n%aI%n%P",
        ];

        let search_arg;
        if let Some(ref search) = query.search {
            if !search.is_empty() {
                search_arg = format!("--grep={search}");
                args.push(&search_arg);
            }
        }

        let output = raw(&query.worktree_path, &args).await?;
        let commits = parse_log_output(&output);

        // 総コミット数を取得
        let mut count_args = vec!["rev-list", "--count", "--all"];
        let count_search_arg;
        if let Some(ref search) = query.search {
            if !search.is_empty() {
                count_search_arg = format!("--grep={search}");
                count_args.push(&count_search_arg);
            }
        }
        let total = raw(&query.worktree_path, &count_args)
            .await
            .ok()
            .and_then(|s| s.trim().parse::<u32>().ok())
            .unwrap_or(commits.len() as u32);

        let has_more = commits.len() as u32 == query.limit;

        Ok(GitLogResult {
            commits,
            total,
            has_more,
        })
    }

    async fn get_commit_detail(&self, worktree_path: &str, hash: &str) -> AppResult<CommitDetail> {
        // コミット情報
        let log_raw = raw(
            worktree_path,
            &["log", "-1", "--format=%H%n%h%n%s%n%an%n%ae%n%aI%n%P", hash],
        )
        .await?;
        let commits = parse_log_output(&log_raw);
        let summary = commits
            .into_iter()
            .next()
            .ok_or_else(|| AppError::NotFound(format!("Commit not found: {hash}")))?;

        // 変更ファイル
        let name_status_raw = raw(
            worktree_path,
            &["diff-tree", "--no-commit-id", "-r", "--name-status", hash],
        )
        .await?;
        let numstat_raw = raw(
            worktree_path,
            &["diff-tree", "--no-commit-id", "-r", "--numstat", hash],
        )
        .await?;
        let files = parse_commit_files(&name_status_raw, &numstat_raw);

        Ok(CommitDetail { summary, files })
    }

    async fn get_diff(
        &self,
        worktree_path: &str,
        file_path: Option<&str>,
    ) -> AppResult<Vec<FileDiff>> {
        let mut args = vec!["diff"];
        if let Some(fp) = file_path {
            args.push("--");
            args.push(fp);
        }
        let output = raw(worktree_path, &args).await?;
        Ok(parse_diff_output(&output))
    }

    async fn get_diff_staged(
        &self,
        worktree_path: &str,
        file_path: Option<&str>,
    ) -> AppResult<Vec<FileDiff>> {
        let mut args = vec!["diff", "--cached"];
        if let Some(fp) = file_path {
            args.push("--");
            args.push(fp);
        }
        let output = raw(worktree_path, &args).await?;
        Ok(parse_diff_output(&output))
    }

    async fn get_diff_commit(
        &self,
        worktree_path: &str,
        hash: &str,
        file_path: Option<&str>,
    ) -> AppResult<Vec<FileDiff>> {
        // 親コミット取得。初回コミットの場合は空ツリーハッシュを使用
        let parent_hash = raw(worktree_path, &["rev-parse", &format!("{hash}^")])
            .await
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|_| "4b825dc642cb6eb9a060e54bf899d69f245b189".to_string());

        let mut args = vec!["diff", &parent_hash, hash];
        if let Some(fp) = file_path {
            args.push("--");
            args.push(fp);
        }
        let output = raw(worktree_path, &args).await?;
        Ok(parse_diff_output(&output))
    }

    async fn get_branches(&self, worktree_path: &str) -> AppResult<BranchList> {
        let output = raw(worktree_path, &["branch", "-a", "-v", "--no-abbrev"]).await?;
        Ok(parse_branch_output(&output))
    }

    async fn get_file_tree(&self, worktree_path: &str) -> AppResult<FileTreeNode> {
        let ls_tree_raw = raw(worktree_path, &["ls-tree", "-r", "--name-only", "HEAD"]).await?;
        let status_raw = raw(worktree_path, &["status", "--porcelain=v1"]).await?;

        let status_map = build_status_map(&status_raw);
        let root_name = Path::new(worktree_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("root");

        Ok(build_file_tree(&ls_tree_raw, &status_map, root_name))
    }

    async fn get_file_contents(
        &self,
        worktree_path: &str,
        file_path: &str,
        staged: bool,
    ) -> AppResult<FileContents> {
        let language = detect_language(file_path);

        // 変更前: HEAD のファイル内容
        let original = raw_or_empty(worktree_path, &["show", &format!("HEAD:{file_path}")]).await;

        // 変更後: staged なら index の内容、そうでなければ作業ツリーの内容
        let modified = if staged {
            raw_or_empty(worktree_path, &["show", &format!(":{file_path}")]).await
        } else {
            read_working_file(worktree_path, file_path).await
        };

        Ok(FileContents {
            original,
            modified,
            language,
        })
    }

    async fn get_file_contents_commit(
        &self,
        worktree_path: &str,
        hash: &str,
        file_path: &str,
    ) -> AppResult<FileContents> {
        let language = detect_language(file_path);

        // 変更前: 親コミットのファイル内容
        let original =
            raw_or_empty(worktree_path, &["show", &format!("{hash}^:{file_path}")]).await;

        // 変更後: 指定コミットのファイル内容
        let modified = raw_or_empty(worktree_path, &["show", &format!("{hash}:{file_path}")]).await;

        Ok(FileContents {
            original,
            modified,
            language,
        })
    }
}

// --- ヘルパー関数 ---

fn parse_status_output(raw: &str) -> GitStatus {
    let mut staged = Vec::new();
    let mut unstaged = Vec::new();
    let mut untracked = Vec::new();

    for line in raw.lines() {
        if line.len() < 3 {
            continue;
        }

        let bytes = line.as_bytes();
        let index = bytes[0] as char;
        let work_tree = bytes[1] as char;
        let file_path = &line[3..];

        if index == '?' && work_tree == '?' {
            untracked.push(file_path.to_string());
            continue;
        }
        if index != ' ' && index != '?' {
            staged.push(FileChange {
                path: file_path.to_string(),
                status: to_file_change_status(index),
                old_path: None,
            });
        }
        if work_tree != ' ' && work_tree != '?' {
            unstaged.push(FileChange {
                path: file_path.to_string(),
                status: to_file_change_status(work_tree),
                old_path: None,
            });
        }
    }

    GitStatus {
        staged,
        unstaged,
        untracked,
    }
}

fn to_file_change_status(code: char) -> FileChangeStatus {
    match code {
        'A' => FileChangeStatus::Added,
        'M' => FileChangeStatus::Modified,
        'D' => FileChangeStatus::Deleted,
        'R' => FileChangeStatus::Renamed,
        'C' => FileChangeStatus::Copied,
        _ => FileChangeStatus::Modified,
    }
}

fn parse_commit_files(name_status_raw: &str, numstat_raw: &str) -> Vec<CommitFileChange> {
    // numstat から additions/deletions を取得
    let mut stat_map = std::collections::HashMap::new();
    for line in numstat_raw.lines() {
        let parts: Vec<&str> = line.splitn(3, '\t').collect();
        if parts.len() == 3 {
            let additions = parts[0].parse::<u32>().unwrap_or(0);
            let deletions = parts[1].parse::<u32>().unwrap_or(0);
            stat_map.insert(parts[2].to_string(), (additions, deletions));
        }
    }

    let mut files = Vec::new();
    for line in name_status_raw.lines() {
        if line.len() < 2 {
            continue;
        }
        let status = line.chars().next().unwrap_or('M');
        let file_path = line[1..].trim();
        if file_path.is_empty() {
            continue;
        }

        let (additions, deletions) = stat_map.get(file_path).copied().unwrap_or((0, 0));

        files.push(CommitFileChange {
            path: file_path.to_string(),
            status: to_file_change_status(status),
            additions,
            deletions,
        });
    }

    files
}

fn parse_branch_output(raw: &str) -> BranchList {
    let mut current = String::new();
    let mut local = Vec::new();
    let mut remote = Vec::new();

    for line in raw.lines() {
        let is_current = line.starts_with('*');
        let line = line.trim_start_matches('*').trim();

        // "HEAD -> origin/main" のような detached HEAD 行をスキップ
        if line.starts_with("(HEAD detached") || line.contains(" -> ") {
            continue;
        }

        // "name  hash message" のパース
        let parts: Vec<&str> = line.splitn(3, char::is_whitespace).collect();
        if parts.len() < 2 {
            continue;
        }

        let name = parts[0];
        let hash = parts[1];

        if is_current {
            current = name.to_string();
        }

        let display_name = name.strip_prefix("remotes/").unwrap_or(name);
        let info = BranchInfo {
            name: display_name.to_string(),
            hash: hash.to_string(),
            is_head: is_current,
        };

        if name.starts_with("remotes/") {
            remote.push(info);
        } else {
            local.push(info);
        }
    }

    BranchList {
        current,
        local,
        remote,
    }
}

fn build_status_map(status_raw: &str) -> std::collections::HashMap<String, FileChangeStatus> {
    let mut map = std::collections::HashMap::new();
    for line in status_raw.lines() {
        if line.len() < 3 {
            continue;
        }
        let bytes = line.as_bytes();
        let index = bytes[0] as char;
        let work_tree = bytes[1] as char;
        let file_path = &line[3..];

        if index == '?' && work_tree == '?' {
            continue;
        }
        if index != ' ' && index != '?' {
            map.insert(file_path.to_string(), to_file_change_status(index));
        } else if work_tree != ' ' {
            map.insert(file_path.to_string(), to_file_change_status(work_tree));
        }
    }
    map
}

fn build_file_tree(
    ls_tree_output: &str,
    status_map: &std::collections::HashMap<String, FileChangeStatus>,
    root_name: &str,
) -> FileTreeNode {
    let mut root = FileTreeNode {
        name: root_name.to_string(),
        path: String::new(),
        node_type: FileTreeNodeType::Directory,
        children: Some(Vec::new()),
        change_status: None,
    };

    for line in ls_tree_output.lines() {
        let file_path = line.trim();
        if file_path.is_empty() {
            continue;
        }
        insert_path(&mut root, file_path, status_map.get(file_path).cloned());
    }

    sort_tree(&mut root);
    root
}

fn insert_path(root: &mut FileTreeNode, file_path: &str, change_status: Option<FileChangeStatus>) {
    let parts: Vec<&str> = file_path.split('/').collect();
    let mut current = root;

    for (i, name) in parts.iter().enumerate() {
        let is_file = i == parts.len() - 1;
        let current_path = parts[..=i].join("/");

        if current.children.is_none() {
            current.children = Some(Vec::new());
        }

        let children = current.children.as_mut().unwrap();
        let exists = children.iter().any(|c| c.name == *name);

        if !exists {
            let node = FileTreeNode {
                name: name.to_string(),
                path: current_path,
                node_type: if is_file {
                    FileTreeNodeType::File
                } else {
                    FileTreeNodeType::Directory
                },
                children: if is_file { None } else { Some(Vec::new()) },
                change_status: if is_file { change_status.clone() } else { None },
            };
            children.push(node);
        }

        if !is_file {
            let children = current.children.as_mut().unwrap();
            let idx = children.iter().position(|c| c.name == *name).unwrap();
            current = &mut children[idx];
        }
    }
}

fn sort_tree(node: &mut FileTreeNode) {
    if let Some(ref mut children) = node.children {
        children.sort_by(|a, b| {
            // ディレクトリ優先
            if a.node_type != b.node_type {
                if a.node_type == FileTreeNodeType::Directory {
                    return std::cmp::Ordering::Less;
                }
                return std::cmp::Ordering::Greater;
            }
            a.name.cmp(&b.name)
        });

        for child in children.iter_mut() {
            sort_tree(child);
        }
    }
}

/// 作業ツリーのファイルを読み取る（パストラバーサル防御付き）。
async fn read_working_file(worktree_path: &str, file_path: &str) -> String {
    let base = match tokio::fs::canonicalize(worktree_path).await {
        Ok(p) => p,
        Err(_) => return String::new(),
    };

    let target = base.join(file_path);
    let resolved = match tokio::fs::canonicalize(&target).await {
        Ok(p) => p,
        Err(_) => return String::new(),
    };

    // パストラバーサル防御
    if !resolved.starts_with(&base) {
        return String::new();
    }

    tokio::fs::read_to_string(&resolved)
        .await
        .unwrap_or_default()
}

/// ファイルパスから Monaco の言語 ID を推定する。
/// TypeScript 側 `detect-language.ts` の 1:1 移植。
fn detect_language(file_path: &str) -> String {
    let ext = file_path.rsplit('.').next().unwrap_or("").to_lowercase();

    match ext.as_str() {
        "ts" | "tsx" => "typescript",
        "js" | "jsx" => "javascript",
        "json" => "json",
        "md" => "markdown",
        "css" => "css",
        "scss" => "scss",
        "html" => "html",
        "xml" => "xml",
        "yaml" | "yml" => "yaml",
        "py" => "python",
        "rs" => "rust",
        "go" => "go",
        "sh" => "shell",
        "toml" => "toml",
        _ => "plaintext",
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_status_output() {
        let raw = " M src/main.rs\nA  new_file.txt\n?? untracked.txt\n";
        let status = parse_status_output(raw);
        assert_eq!(status.staged.len(), 1);
        assert_eq!(status.staged[0].path, "new_file.txt");
        assert_eq!(status.unstaged.len(), 1);
        assert_eq!(status.unstaged[0].path, "src/main.rs");
        assert_eq!(status.untracked.len(), 1);
        assert_eq!(status.untracked[0], "untracked.txt");
    }

    #[test]
    fn test_parse_branch_output() {
        let raw = "* main                    abc1234 commit message\n  feature/foo             def5678 another message\n  remotes/origin/main     abc1234 commit message\n";
        let branches = parse_branch_output(raw);
        assert_eq!(branches.current, "main");
        assert_eq!(branches.local.len(), 2);
        assert_eq!(branches.remote.len(), 1);
        assert!(branches.local[0].is_head);
        assert_eq!(branches.remote[0].name, "origin/main");
    }

    #[test]
    fn test_parse_commit_files() {
        let name_status = "M\tsrc/main.rs\nA\tnew_file.txt\n";
        let numstat = "10\t5\tsrc/main.rs\n20\t0\tnew_file.txt\n";
        let files = parse_commit_files(name_status, numstat);
        assert_eq!(files.len(), 2);
        assert_eq!(files[0].path, "src/main.rs");
        assert_eq!(files[0].additions, 10);
        assert_eq!(files[0].deletions, 5);
    }

    #[test]
    fn test_build_file_tree() {
        let ls_tree = "src/main.rs\nsrc/lib.rs\nREADME.md\n";
        let status_map = std::collections::HashMap::new();
        let tree = build_file_tree(ls_tree, &status_map, "project");
        assert_eq!(tree.name, "project");
        let children = tree.children.as_ref().unwrap();
        // ディレクトリ優先ソート: src/ が先、README.md が後
        assert_eq!(children[0].name, "src");
        assert_eq!(children[1].name, "README.md");
        let src_children = children[0].children.as_ref().unwrap();
        assert_eq!(src_children.len(), 2);
    }

    #[test]
    fn test_detect_language() {
        assert_eq!(detect_language("main.rs"), "rust");
        assert_eq!(detect_language("app.tsx"), "typescript");
        assert_eq!(detect_language("Cargo.toml"), "toml");
        assert_eq!(detect_language("unknownfile"), "plaintext");
    }
}
