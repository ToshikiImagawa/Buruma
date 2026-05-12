//! 差分解説用プロンプトビルダー。

/// 差分テキストに対する解説リクエストプロンプトを構築する。
pub fn build_explain_diff_prompt(diff_text: &str) -> String {
    format!(
        "Explain the following code diff in detail. \
         Describe what changes were made and why they might have been made:\n\n{}",
        diff_text
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_prompt_contains_explain_instruction_and_diff() {
        let prompt = build_explain_diff_prompt("DIFF_BODY");
        assert!(prompt.contains("Explain the following code diff in detail"));
        assert!(prompt.ends_with("DIFF_BODY"));
    }
}
