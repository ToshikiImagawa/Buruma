//! Claude CLI 出力を構造化結果に変換するパーサー群。
//!
//! `DefaultClaudeRepository` が CLI 実行結果を解析する際の純粋関数として利用される。
//! CLI 出力フォーマットの変化に追従しやすいよう本モジュールに集約し、ユニットテストで保護する。

use crate::features::claude_code_integration::domain::{
    ClaudeAuthStatus, ConflictResolveResult, ExplainResult, ReviewComment, ReviewResult, ReviewSeverity,
};

/// `parse_auth_status` が受け入れる stdout の最大サイズ（バイト）。
/// 不正・巨大な出力による JSON パーサーのメモリ消費を防ぐためのハードキャップ。
const MAX_AUTH_STATUS_OUTPUT_SIZE: usize = 64 * 1024;

/// `AppError` のエラーメッセージとして外部 CLI の stderr を埋め込む際の最大サイズ（バイト）。
/// CLI が暴走した場合に巨大文字列が UI/ログへ伝播するのを防ぐ。
const MAX_ERROR_MESSAGE_SIZE: usize = 2 * 1024;

/// `claude auth status` の JSON 出力（成功時）またはテキスト出力（失敗時）から認証状態を組み立てる。
///
/// `success` は `Command` の `ExitStatus::success()`、`stdout` は標準出力テキスト。
/// `stdout` が `MAX_AUTH_STATUS_OUTPUT_SIZE` を超える場合は未認証として扱う（DoS 対策）。
pub fn parse_auth_status(success: bool, stdout: &str) -> ClaudeAuthStatus {
    if !success || stdout.len() > MAX_AUTH_STATUS_OUTPUT_SIZE {
        return ClaudeAuthStatus {
            authenticated: false,
            account_email: None,
        };
    }

    if let Ok(json) = serde_json::from_str::<serde_json::Value>(stdout) {
        let logged_in = json.get("loggedIn").and_then(|v| v.as_bool()).unwrap_or(false);
        let email = json.get("email").and_then(|v| v.as_str()).map(|s| s.to_string());
        ClaudeAuthStatus {
            authenticated: logged_in,
            account_email: email,
        }
    } else {
        ClaudeAuthStatus {
            authenticated: stdout.contains("loggedIn")
                || stdout.contains("Logged in")
                || stdout.contains("authenticated"),
            account_email: None,
        }
    }
}

/// コミットメッセージ生成結果の整形（前後空白除去のみ）。
pub fn parse_commit_message(stdout: &str) -> String {
    stdout.trim().to_string()
}

/// 外部 CLI の stderr などをエラーメッセージとして埋め込む前に前後空白を除去し、
/// `MAX_ERROR_MESSAGE_SIZE` を超える分を切り詰める。
/// UTF-8 マルチバイト境界を尊重する。
pub fn truncate_error_message(text: &str) -> String {
    let trimmed = text.trim();
    if trimmed.len() <= MAX_ERROR_MESSAGE_SIZE {
        return trimmed.to_string();
    }
    let mut idx = MAX_ERROR_MESSAGE_SIZE;
    while idx > 0 && !trimmed.is_char_boundary(idx) {
        idx -= 1;
    }
    format!("{}... (truncated)", &trimmed[..idx])
}

/// レビュー結果の組み立て。
///
/// 現状の CLI 出力は非構造化テキストのため、stdout 全体を 1 件の info コメントとサマリーに格納する。
/// 失敗時は空コメントと固定エラーメッセージで `ReviewResult` を返す。
pub fn build_review_result(worktree_path: &str, success: bool, stdout: &str) -> ReviewResult {
    if success {
        let text = stdout.to_string();
        ReviewResult {
            worktree_path: worktree_path.to_string(),
            comments: vec![ReviewComment {
                id: uuid::Uuid::new_v4().to_string(),
                file_path: String::new(),
                line_start: 0,
                line_end: 0,
                severity: ReviewSeverity::Info,
                message: text.clone(),
                suggestion: None,
            }],
            summary: text,
        }
    } else {
        ReviewResult {
            worktree_path: worktree_path.to_string(),
            comments: Vec::new(),
            summary: "Review failed".to_string(),
        }
    }
}

/// 差分解説結果の組み立て。
pub fn build_explain_result(worktree_path: &str, success: bool, stdout: &str) -> ExplainResult {
    if success {
        ExplainResult {
            worktree_path: worktree_path.to_string(),
            explanation: stdout.trim().to_string(),
        }
    } else {
        ExplainResult {
            worktree_path: worktree_path.to_string(),
            explanation: "Explanation failed".to_string(),
        }
    }
}

/// コンフリクト解決結果の組み立て。
///
/// 成功時は stdout を merged 内容として採用し、失敗時は stderr を error にする（空なら固定文言）。
pub fn build_conflict_resolve_result(
    worktree_path: &str,
    file_path: &str,
    success: bool,
    stdout: &str,
    stderr: &str,
) -> ConflictResolveResult {
    if success {
        ConflictResolveResult::Resolved {
            worktree_path: worktree_path.to_string(),
            file_path: file_path.to_string(),
            merged_content: stdout.trim().to_string(),
        }
    } else {
        let trimmed = stderr.trim();
        let error = if trimmed.is_empty() {
            "Conflict resolution failed".to_string()
        } else {
            trimmed.to_string()
        };
        ConflictResolveResult::Failed {
            worktree_path: worktree_path.to_string(),
            file_path: file_path.to_string(),
            error,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_auth_status_handles_success_json() {
        let status = parse_auth_status(true, r#"{"loggedIn": true, "email": "user@example.com"}"#);
        assert!(status.authenticated);
        assert_eq!(status.account_email.as_deref(), Some("user@example.com"));
    }

    #[test]
    fn parse_auth_status_handles_logged_out_json() {
        let status = parse_auth_status(true, r#"{"loggedIn": false}"#);
        assert!(!status.authenticated);
        assert!(status.account_email.is_none());
    }

    #[test]
    fn parse_auth_status_falls_back_to_text_match() {
        let status = parse_auth_status(true, "Logged in as user");
        assert!(status.authenticated);
        assert!(status.account_email.is_none());
    }

    #[test]
    fn parse_auth_status_returns_unauthenticated_on_failure() {
        let status = parse_auth_status(false, "");
        assert!(!status.authenticated);
    }

    #[test]
    fn parse_auth_status_returns_unauthenticated_when_stdout_exceeds_size_cap() {
        let oversized = "a".repeat(MAX_AUTH_STATUS_OUTPUT_SIZE + 1);
        let status = parse_auth_status(true, &oversized);
        assert!(!status.authenticated);
        assert!(status.account_email.is_none());
    }

    #[test]
    fn parse_commit_message_trims_whitespace() {
        assert_eq!(parse_commit_message("  feat: x\n\n"), "feat: x");
    }

    #[test]
    fn truncate_error_message_within_limit_returns_trimmed_text() {
        assert_eq!(truncate_error_message("  oops  "), "oops");
    }

    #[test]
    fn truncate_error_message_above_limit_appends_marker() {
        let oversized = "x".repeat(MAX_ERROR_MESSAGE_SIZE + 100);
        let result = truncate_error_message(&oversized);
        assert!(result.ends_with("... (truncated)"));
        assert!(result.len() <= MAX_ERROR_MESSAGE_SIZE + "... (truncated)".len());
    }

    #[test]
    fn truncate_error_message_respects_utf8_char_boundary() {
        // 3-byte 文字を MAX 直前に配置し、境界で切断されないことを確認する。
        let mut input = "a".repeat(MAX_ERROR_MESSAGE_SIZE - 1);
        input.push('あ'); // 3-byte char
        input.push_str(&"b".repeat(100));
        let result = truncate_error_message(&input);
        // truncated 部分が valid UTF-8 であること（panic しないこと）。
        assert!(result.ends_with("... (truncated)"));
    }

    #[test]
    fn build_review_result_success_contains_single_info_comment() {
        let result = build_review_result("/repo", true, "some review text");
        assert_eq!(result.worktree_path, "/repo");
        assert_eq!(result.comments.len(), 1);
        assert!(matches!(result.comments[0].severity, ReviewSeverity::Info));
        assert_eq!(result.summary, "some review text");
    }

    #[test]
    fn build_review_result_failure_has_no_comments_and_error_summary() {
        let result = build_review_result("/repo", false, "ignored");
        assert!(result.comments.is_empty());
        assert_eq!(result.summary, "Review failed");
    }

    #[test]
    fn build_explain_result_success_trims_explanation() {
        let result = build_explain_result("/repo", true, "  explanation  \n");
        assert_eq!(result.explanation, "explanation");
    }

    #[test]
    fn build_explain_result_failure_uses_fixed_message() {
        let result = build_explain_result("/repo", false, "");
        assert_eq!(result.explanation, "Explanation failed");
    }

    #[test]
    fn build_conflict_resolve_result_success_returns_resolved() {
        let result = build_conflict_resolve_result("/repo", "a.rs", true, "merged content\n", "");
        match result {
            ConflictResolveResult::Resolved { merged_content, .. } => {
                assert_eq!(merged_content, "merged content");
            }
            _ => panic!("expected Resolved"),
        }
    }

    #[test]
    fn build_conflict_resolve_result_failure_uses_stderr_when_present() {
        let result = build_conflict_resolve_result("/repo", "a.rs", false, "", "boom");
        match result {
            ConflictResolveResult::Failed { error, .. } => assert_eq!(error, "boom"),
            _ => panic!("expected Failed"),
        }
    }

    #[test]
    fn build_conflict_resolve_result_failure_uses_default_when_stderr_empty() {
        let result = build_conflict_resolve_result("/repo", "a.rs", false, "", "  ");
        match result {
            ConflictResolveResult::Failed { error, .. } => assert_eq!(error, "Conflict resolution failed"),
            _ => panic!("expected Failed"),
        }
    }
}
