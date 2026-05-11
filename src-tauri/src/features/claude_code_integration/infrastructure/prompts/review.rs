//! コードレビュー用プロンプトビルダー。

/// 差分テキストに対するレビュー指示プロンプトを構築する。
///
/// CLI 出力は `OutputParser::build_review_result` で `ReviewResult` に整形される。
pub fn build_review_diff_prompt(diff_text: &str) -> String {
    format!(
        "Review the following code diff. For each issue found, provide:\n\
         - file path\n- line numbers\n- severity (info/warning/error)\n\
         - description\n- suggestion (if applicable)\n\n\
         Also provide a brief summary.\n\n{}",
        diff_text
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_prompt_includes_required_sections() {
        let prompt = build_review_diff_prompt("--- a/x\n+++ b/x\n");
        assert!(prompt.contains("Review the following code diff"));
        assert!(prompt.contains("file path"));
        assert!(prompt.contains("line numbers"));
        assert!(prompt.contains("severity"));
        assert!(prompt.contains("brief summary"));
        assert!(prompt.ends_with("--- a/x\n+++ b/x\n"));
    }
}
