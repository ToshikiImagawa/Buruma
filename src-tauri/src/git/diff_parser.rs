//! `git diff` unified diff 出力のパーサー。
//! TypeScript 側 `diff-parser.ts` の 1:1 移植。

use crate::features::repository_viewer::domain::{DiffHunk, DiffLine, DiffLineType, FileDiff};
use crate::features::worktree_management::domain::FileChangeStatus;

/// git diff の raw 出力を `Vec<FileDiff>` にパースする。
pub fn parse_diff_output(raw: &str) -> Vec<FileDiff> {
    if raw.trim().is_empty() {
        return Vec::new();
    }

    raw.split("diff --git ")
        .filter(|s| !s.is_empty())
        .map(parse_file_section)
        .collect()
}

fn parse_file_section(section: &str) -> FileDiff {
    let lines: Vec<&str> = section.lines().collect();

    // ファイルパスを抽出: "a/path b/path"
    let (old_path, new_path) = if let Some(first) = lines.first() {
        parse_header_paths(first)
    } else {
        (String::new(), String::new())
    };

    let is_binary = lines.iter().any(|l| l.starts_with("Binary files"));
    let status = detect_change_status(&lines);
    let is_renamed = status == FileChangeStatus::Renamed;

    let hunks = if is_binary {
        Vec::new()
    } else {
        parse_hunks(&lines)
    };

    FileDiff {
        file_path: new_path,
        old_file_path: if is_renamed { Some(old_path) } else { None },
        status,
        hunks,
        is_binary,
    }
}

fn parse_header_paths(header: &str) -> (String, String) {
    // "a/path b/path" のパース
    if let Some((a, b)) = header.split_once(" b/") {
        let old = a.strip_prefix("a/").unwrap_or(a).to_string();
        let new = b.to_string();
        (old, new)
    } else {
        (String::new(), String::new())
    }
}

fn detect_change_status(lines: &[&str]) -> FileChangeStatus {
    for line in lines {
        if line.starts_with("new file mode") {
            return FileChangeStatus::Added;
        }
        if line.starts_with("deleted file mode") {
            return FileChangeStatus::Deleted;
        }
        if line.starts_with("rename from") || line.starts_with("similarity index") {
            return FileChangeStatus::Renamed;
        }
        if line.starts_with("copy from") {
            return FileChangeStatus::Copied;
        }
    }
    FileChangeStatus::Modified
}

fn parse_hunks(lines: &[&str]) -> Vec<DiffHunk> {
    let mut hunks: Vec<DiffHunk> = Vec::new();
    let mut current_hunk: Option<DiffHunk> = None;

    for line in lines {
        // ハンクヘッダ: @@ -old,count +new,count @@ ...
        if line.starts_with("@@ ") {
            if let Some(hunk) = current_hunk.take() {
                hunks.push(hunk);
            }
            if let Some(hunk) = parse_hunk_header(line) {
                current_hunk = Some(hunk);
            }
            continue;
        }

        let Some(ref mut hunk) = current_hunk else {
            continue;
        };

        if let Some(content) = line.strip_prefix('+') {
            hunk.lines.push(DiffLine {
                line_type: DiffLineType::Add,
                content: content.to_string(),
                old_line_number: None,
                new_line_number: None,
            });
        } else if let Some(content) = line.strip_prefix('-') {
            hunk.lines.push(DiffLine {
                line_type: DiffLineType::Delete,
                content: content.to_string(),
                old_line_number: None,
                new_line_number: None,
            });
        } else if line.starts_with(' ') || line.is_empty() {
            // diff 出力の終端空行はスキップ
            if line.is_empty() && !hunk.lines.is_empty() {
                continue;
            }
            let content = line.strip_prefix(' ').unwrap_or(line);
            hunk.lines.push(DiffLine {
                line_type: DiffLineType::Context,
                content: content.to_string(),
                old_line_number: None,
                new_line_number: None,
            });
        }
    }

    if let Some(hunk) = current_hunk {
        hunks.push(hunk);
    }

    // 行番号を割り当て
    for hunk in &mut hunks {
        assign_line_numbers(hunk);
    }

    hunks
}

fn parse_hunk_header(line: &str) -> Option<DiffHunk> {
    // @@ -old,count +new,count @@ header
    let rest = line.strip_prefix("@@ ")?;
    let at_end = rest.find(" @@")?;
    let range_part = &rest[..at_end];

    let parts: Vec<&str> = range_part.split_whitespace().collect();
    if parts.len() < 2 {
        return None;
    }

    let (old_start, old_lines) = parse_range(parts[0].strip_prefix('-')?)?;
    let (new_start, new_lines) = parse_range(parts[1].strip_prefix('+')?)?;

    Some(DiffHunk {
        old_start,
        old_lines,
        new_start,
        new_lines,
        header: line.to_string(),
        lines: Vec::new(),
    })
}

fn parse_range(s: &str) -> Option<(u32, u32)> {
    if let Some((start, count)) = s.split_once(',') {
        Some((start.parse().ok()?, count.parse().ok()?))
    } else {
        Some((s.parse().ok()?, 1))
    }
}

fn assign_line_numbers(hunk: &mut DiffHunk) {
    let mut old_line = hunk.old_start;
    let mut new_line = hunk.new_start;

    for line in &mut hunk.lines {
        match line.line_type {
            DiffLineType::Context => {
                line.old_line_number = Some(old_line);
                line.new_line_number = Some(new_line);
                old_line += 1;
                new_line += 1;
            }
            DiffLineType::Delete => {
                line.old_line_number = Some(old_line);
                old_line += 1;
            }
            DiffLineType::Add => {
                line.new_line_number = Some(new_line);
                new_line += 1;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_empty() {
        assert!(parse_diff_output("").is_empty());
        assert!(parse_diff_output("   ").is_empty());
    }

    #[test]
    fn test_parse_simple_diff() {
        let raw = r#"diff --git a/src/main.rs b/src/main.rs
index abc123..def456 100644
--- a/src/main.rs
+++ b/src/main.rs
@@ -1,3 +1,4 @@
 fn main() {
+    println!("hello");
     println!("world");
 }
"#;
        let diffs = parse_diff_output(raw);
        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].file_path, "src/main.rs");
        assert_eq!(diffs[0].status, FileChangeStatus::Modified);
        assert!(!diffs[0].is_binary);
        assert_eq!(diffs[0].hunks.len(), 1);

        let hunk = &diffs[0].hunks[0];
        assert_eq!(hunk.old_start, 1);
        assert_eq!(hunk.old_lines, 3);
        assert_eq!(hunk.new_start, 1);
        assert_eq!(hunk.new_lines, 4);
        assert_eq!(hunk.lines.len(), 4);
    }

    #[test]
    fn test_parse_new_file() {
        let raw = r#"diff --git a/new.txt b/new.txt
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/new.txt
@@ -0,0 +1,2 @@
+line1
+line2
"#;
        let diffs = parse_diff_output(raw);
        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].status, FileChangeStatus::Added);
    }

    #[test]
    fn test_parse_binary() {
        let raw = r#"diff --git a/image.png b/image.png
Binary files a/image.png and b/image.png differ
"#;
        let diffs = parse_diff_output(raw);
        assert_eq!(diffs.len(), 1);
        assert!(diffs[0].is_binary);
        assert!(diffs[0].hunks.is_empty());
    }
}
