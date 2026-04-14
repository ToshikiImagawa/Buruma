//! `git log` 出力のパーサー。
//! TypeScript 側 `parseLogOutput` の 1:1 移植。
//!
//! `--format=%H%n%h%n%s%n%an%n%ae%n%aI%n%P` で 7 行ごとのブロック。

use crate::features::repository_viewer::domain::CommitSummary;

/// git log の 7-line フォーマット出力を `Vec<CommitSummary>` にパースする。
///
/// 注: parents が空 (初回コミット) の場合、`%P` が空行を出力するため、
/// 空行フィルタではなく `split("\n")` で全行を保持し 7 行ずつ処理する。
pub fn parse_log_output(raw: &str) -> Vec<CommitSummary> {
    let lines: Vec<&str> = raw.split('\n').collect();
    let mut commits = Vec::new();

    let mut i = 0;
    while i + 6 < lines.len() {
        // 最初の 6 行が空でないことを確認 (hash が空ならブロック終端)
        if lines[i].is_empty() {
            i += 1;
            continue;
        }

        let parents: Vec<String> = lines[i + 6]
            .split_whitespace()
            .filter(|p| !p.is_empty())
            .map(|p| p.to_string())
            .collect();

        commits.push(CommitSummary {
            hash: lines[i].to_string(),
            hash_short: lines[i + 1].to_string(),
            message: lines[i + 2].to_string(),
            author: lines[i + 3].to_string(),
            author_email: lines[i + 4].to_string(),
            date: lines[i + 5].to_string(),
            parents,
        });

        i += 7;
    }

    commits
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_log_output() {
        let raw = "abc123def456\nabc123d\nInitial commit\nJohn Doe\njohn@example.com\n2026-04-10T12:00:00+09:00\n\n";
        let commits = parse_log_output(raw);
        assert_eq!(commits.len(), 1);
        assert_eq!(commits[0].hash, "abc123def456");
        assert_eq!(commits[0].hash_short, "abc123d");
        assert_eq!(commits[0].message, "Initial commit");
        assert_eq!(commits[0].author, "John Doe");
        assert!(commits[0].parents.is_empty());
    }

    #[test]
    fn test_parse_multiple_commits() {
        let raw = "aaa\na\nmsg1\nauthor1\na1@x.com\n2026-01-01T00:00:00Z\n\nbbb\nb\nmsg2\nauthor2\na2@x.com\n2026-01-02T00:00:00Z\naaa\n";
        let commits = parse_log_output(raw);
        assert_eq!(commits.len(), 2);
        assert_eq!(commits[0].parents.is_empty(), true);
        assert_eq!(commits[1].parents, vec!["aaa"]);
    }

    #[test]
    fn test_parse_with_parents() {
        let raw = "abc\na\nmsg\nauth\na@x.com\n2026-01-01T00:00:00Z\nparent1 parent2\n";
        let commits = parse_log_output(raw);
        assert_eq!(commits.len(), 1);
        assert_eq!(commits[0].parents, vec!["parent1", "parent2"]);
    }

    #[test]
    fn test_parse_empty() {
        let commits = parse_log_output("");
        assert!(commits.is_empty());
    }
}
