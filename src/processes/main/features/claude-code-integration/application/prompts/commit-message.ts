const MAX_DIFF_LENGTH = 100000

export const DEFAULT_COMMIT_MESSAGE_RULES = `- 日本語で記述
- プレフィックス付き: [add], [update], [fix], [refactoring], [remove], [docs], [test]
- 簡潔に変更内容を説明（1〜2行）
- コミットメッセージのみを出力し、説明や装飾は含めない`

export function buildCommitMessagePrompt(diffText: string, customRules?: string | null): string {
  const truncated =
    diffText.length > MAX_DIFF_LENGTH ? diffText.slice(0, MAX_DIFF_LENGTH) + '\n\n(truncated)' : diffText
  const rules = customRules?.trim() || DEFAULT_COMMIT_MESSAGE_RULES

  return `以下のステージング差分に対する適切なコミットメッセージを1つだけ生成してください。

ルール:
${rules}

差分:
\`\`\`diff
${truncated}
\`\`\``
}
