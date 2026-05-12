//! コミットメッセージ生成プロンプトビルダー。

use crate::features::claude_code_integration::domain::GenerateCommitMessageArgs;

/// コミットメッセージ生成プロンプトを構築する。
/// `AppSettings.commitMessageRules` が指定されている場合はデフォルト指示に追記する。
pub fn build_commit_message_prompt(args: &GenerateCommitMessageArgs) -> String {
    let mut prompt = String::from(
        "Generate a concise git commit message for the following diff. \
         Reply with ONLY the commit message, no explanation.",
    );

    if let Some(rules) = args.rules.as_deref() {
        let trimmed = rules.trim();
        if !trimmed.is_empty() {
            prompt.push_str("\n\nAdditional rules (provided by the user — follow them strictly):\n");
            prompt.push_str(trimmed);
        }
    }

    prompt.push_str("\n\nDiff:\n");
    prompt.push_str(&args.diff_text);
    prompt
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_args(rules: Option<&str>) -> GenerateCommitMessageArgs {
        GenerateCommitMessageArgs {
            worktree_path: "/tmp/repo".to_string(),
            diff_text: "--- a/x.rs\n+++ b/x.rs\n@@\n-1\n+2\n".to_string(),
            rules: rules.map(|s| s.to_string()),
        }
    }

    #[test]
    fn build_prompt_without_rules_uses_default_only() {
        let prompt = build_commit_message_prompt(&make_args(None));

        assert!(prompt.contains("Generate a concise git commit message"));
        assert!(prompt.contains("Reply with ONLY the commit message"));
        assert!(!prompt.contains("Additional rules"));
        assert!(prompt.contains("Diff:\n--- a/x.rs"));
    }

    #[test]
    fn build_prompt_with_rules_appends_user_rules_before_diff() {
        let prompt = build_commit_message_prompt(&make_args(Some("- Use Conventional Commits\n- Write in Japanese")));

        assert!(prompt.contains("Additional rules"));
        assert!(prompt.contains("- Use Conventional Commits"));
        assert!(prompt.contains("- Write in Japanese"));

        let rules_idx = prompt.find("Conventional Commits").expect("rules present");
        let diff_idx = prompt.find("Diff:").expect("diff marker present");
        assert!(rules_idx < diff_idx);
    }

    #[test]
    fn build_prompt_with_blank_rules_is_treated_as_none() {
        let prompt = build_commit_message_prompt(&make_args(Some("   \n  ")));

        assert!(!prompt.contains("Additional rules"));
    }
}
