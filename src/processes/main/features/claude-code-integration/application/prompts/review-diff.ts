const MAX_DIFF_LENGTH = 100000

export function buildReviewDiffPrompt(diffText: string): string {
  const truncated =
    diffText.length > MAX_DIFF_LENGTH ? diffText.slice(0, MAX_DIFF_LENGTH) + '\n\n(truncated)' : diffText

  return `以下の差分をコードレビューしてください。

レビュー結果を以下のJSON形式で出力してください。JSON以外のテキストは含めないでください。

\`\`\`json
{
  "comments": [
    {
      "filePath": "ファイルパス",
      "lineStart": 開始行番号,
      "lineEnd": 終了行番号,
      "severity": "info" | "warning" | "error",
      "message": "指摘内容",
      "suggestion": "修正提案コード（任意）"
    }
  ],
  "summary": "レビュー全体のサマリー"
}
\`\`\`

severity の基準:
- error: バグ、セキュリティ問題、データ損失の可能性
- warning: パフォーマンス問題、ベストプラクティス違反、潜在的な問題
- info: スタイル改善、リファクタリング提案、コメント追加提案

差分:
\`\`\`diff
${truncated}
\`\`\``
}
