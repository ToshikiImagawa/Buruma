import { describe, expect, it } from 'vitest'
import { ClaudeDefaultOutputParser } from '../claude-default-output-parser'

describe('ClaudeDefaultOutputParser', () => {
  const parser = new ClaudeDefaultOutputParser()

  describe('parseReviewComments', () => {
    it('JSON ブロック付きのレビュー結果をパースする', () => {
      const output = `\`\`\`json
{
  "comments": [
    {
      "filePath": "src/index.ts",
      "lineStart": 10,
      "lineEnd": 15,
      "severity": "warning",
      "message": "未使用の変数があります",
      "suggestion": "const used = value"
    }
  ],
  "summary": "軽微な問題が1件あります"
}
\`\`\``

      const result = parser.parseReviewComments(output)

      expect(result.comments).toHaveLength(1)
      expect(result.comments[0]).toEqual({
        id: 'review-0',
        filePath: 'src/index.ts',
        lineStart: 10,
        lineEnd: 15,
        severity: 'warning',
        message: '未使用の変数があります',
        suggestion: 'const used = value',
      })
      expect(result.summary).toBe('軽微な問題が1件あります')
    })

    it('JSON ブロックなしの生テキストはフォールバックする', () => {
      const output = 'コードに問題は見つかりませんでした。'

      const result = parser.parseReviewComments(output)

      expect(result.comments).toHaveLength(0)
      expect(result.summary).toBe('コードに問題は見つかりませんでした。')
    })

    it('不正な JSON はフォールバックする', () => {
      const output = '```json\n{invalid json}\n```'

      const result = parser.parseReviewComments(output)

      expect(result.comments).toHaveLength(0)
      expect(result.summary).toBe(output.trim())
    })

    it('message のないコメントはスキップする', () => {
      const output = `\`\`\`json
{
  "comments": [
    { "filePath": "a.ts", "lineStart": 1, "severity": "info" },
    { "filePath": "b.ts", "lineStart": 2, "severity": "error", "message": "バグです" }
  ],
  "summary": "1件"
}
\`\`\``

      const result = parser.parseReviewComments(output)

      expect(result.comments).toHaveLength(1)
      expect(result.comments[0].filePath).toBe('b.ts')
    })

    it('不正な severity はデフォルトで info になる', () => {
      const output = `\`\`\`json
{
  "comments": [
    { "filePath": "a.ts", "lineStart": 1, "lineEnd": 1, "severity": "critical", "message": "問題" }
  ],
  "summary": ""
}
\`\`\``

      const result = parser.parseReviewComments(output)

      expect(result.comments[0].severity).toBe('info')
    })

    it('lineEnd が省略された場合は lineStart と同じ値になる', () => {
      const output = `\`\`\`json
{
  "comments": [
    { "filePath": "a.ts", "lineStart": 5, "severity": "warning", "message": "問題" }
  ],
  "summary": ""
}
\`\`\``

      const result = parser.parseReviewComments(output)

      expect(result.comments[0].lineEnd).toBe(5)
    })

    it('JSON ブロック外のテキスト付きでもパースできる', () => {
      const output = `レビュー結果:
\`\`\`json
{
  "comments": [
    { "filePath": "x.ts", "lineStart": 1, "lineEnd": 1, "severity": "info", "message": "OK" }
  ],
  "summary": "問題なし"
}
\`\`\`
以上です。`

      const result = parser.parseReviewComments(output)

      expect(result.comments).toHaveLength(1)
      expect(result.summary).toBe('問題なし')
    })

    it('空のコメント配列を正しく処理する', () => {
      const output = `\`\`\`json
{ "comments": [], "summary": "問題なし" }
\`\`\``

      const result = parser.parseReviewComments(output)

      expect(result.comments).toHaveLength(0)
      expect(result.summary).toBe('問題なし')
    })

    it('複数コメントに連番 ID を付与する', () => {
      const output = `\`\`\`json
{
  "comments": [
    { "filePath": "a.ts", "lineStart": 1, "lineEnd": 1, "severity": "info", "message": "A" },
    { "filePath": "b.ts", "lineStart": 2, "lineEnd": 2, "severity": "warning", "message": "B" }
  ],
  "summary": ""
}
\`\`\``

      const result = parser.parseReviewComments(output)

      expect(result.comments[0].id).toBe('review-0')
      expect(result.comments[1].id).toBe('review-1')
    })
  })

  describe('parseExplanation', () => {
    it('テキストをトリムして返す', () => {
      const output = '  \n解説テキストです。\n  '

      expect(parser.parseExplanation(output)).toBe('解説テキストです。')
    })

    it('マークダウンをそのまま返す', () => {
      const output = '## 概要\n\n変更の目的は...'

      expect(parser.parseExplanation(output)).toBe(output)
    })
  })
})
