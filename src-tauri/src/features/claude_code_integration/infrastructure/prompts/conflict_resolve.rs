//! AI コンフリクト解決用プロンプトビルダー。

use crate::features::claude_code_integration::domain::ThreeWayContent;

/// 3 ウェイマージ内容とファイルパスから、merged 結果のみを返すよう指示する構造化プロンプトを構築する。
pub fn build_conflict_resolve_prompt(file_path: &str, three_way: &ThreeWayContent) -> String {
    format!(
        "You are resolving a git merge conflict for the file: {file_path}\n\n\
         Below are the three versions of the file.\n\n\
         === BASE (common ancestor) ===\n{base}\n\n\
         === OURS (current branch) ===\n{ours}\n\n\
         === THEIRS (incoming branch) ===\n{theirs}\n\n\
         Merge these three versions into a single resolved file that preserves \
         the intent of both OURS and THEIRS changes relative to BASE.\n\n\
         IMPORTANT: Reply with ONLY the merged file content. \
         Do NOT include any explanation, markdown fences, or extra text.",
        file_path = file_path,
        base = three_way.base,
        ours = three_way.ours,
        theirs = three_way.theirs,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_three_way() -> ThreeWayContent {
        ThreeWayContent {
            base: "BASE_CONTENT".to_string(),
            ours: "OURS_CONTENT".to_string(),
            theirs: "THEIRS_CONTENT".to_string(),
            merged: "MERGED_PLACEHOLDER".to_string(),
        }
    }

    #[test]
    fn build_prompt_contains_file_path_and_three_sections() {
        let prompt = build_conflict_resolve_prompt("src/lib.rs", &make_three_way());
        assert!(prompt.contains("src/lib.rs"));
        assert!(prompt.contains("=== BASE"));
        assert!(prompt.contains("=== OURS"));
        assert!(prompt.contains("=== THEIRS"));
        assert!(prompt.contains("BASE_CONTENT"));
        assert!(prompt.contains("OURS_CONTENT"));
        assert!(prompt.contains("THEIRS_CONTENT"));
    }

    #[test]
    fn build_prompt_instructs_to_reply_only_merged_content() {
        let prompt = build_conflict_resolve_prompt("a.rs", &make_three_way());
        assert!(prompt.contains("Reply with ONLY the merged file content"));
        assert!(prompt.contains("Do NOT include any explanation"));
    }
}
