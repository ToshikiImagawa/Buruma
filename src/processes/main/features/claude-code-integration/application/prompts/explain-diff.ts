const MAX_DIFF_LENGTH = 100000

export function buildExplainDiffPrompt(diffText: string): string {
  const truncated =
    diffText.length > MAX_DIFF_LENGTH ? diffText.slice(0, MAX_DIFF_LENGTH) + '\n\n(truncated)' : diffText

  return `以下の差分の内容をわかりやすく解説してください。

解説はマークダウン形式で出力してください。以下の構成で記述してください:

1. **概要** — 変更の全体的な目的・意図
2. **変更点の詳細** — ファイルごとの主要な変更内容
3. **影響範囲** — この変更が影響する可能性のある箇所
4. **注意点** — レビュー時に注意すべき点（あれば）

差分:
\`\`\`diff
${truncated}
\`\`\``
}
