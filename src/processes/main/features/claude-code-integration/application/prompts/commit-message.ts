import { DEFAULT_COMMIT_MESSAGE_RULES } from '@domain'

export { DEFAULT_COMMIT_MESSAGE_RULES }

const MAX_DIFF_LENGTH = 100000

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
