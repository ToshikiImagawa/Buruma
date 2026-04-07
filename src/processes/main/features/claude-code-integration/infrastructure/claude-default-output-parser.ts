import type { ReviewComment, ReviewSeverity } from '@domain'
import type { ClaudeOutputParser } from '../application/repositories/claude-output-parser'

interface RawReviewComment {
  filePath?: string
  lineStart?: number
  lineEnd?: number
  severity?: string
  message?: string
  suggestion?: string
}

interface RawReviewResult {
  comments?: RawReviewComment[]
  summary?: string
}

const VALID_SEVERITIES: ReviewSeverity[] = ['info', 'warning', 'error']

function isValidSeverity(value: unknown): value is ReviewSeverity {
  return typeof value === 'string' && VALID_SEVERITIES.includes(value as ReviewSeverity)
}

function extractJsonBlock(text: string): string | null {
  // ```json ... ``` ブロックから抽出
  const jsonBlockMatch = text.match(/```json\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim()
  }
  // { で始まり } で終わる最大の範囲を抽出
  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    return braceMatch[0]
  }
  return null
}

function sanitizeComment(raw: RawReviewComment, index: number): ReviewComment | null {
  if (!raw.message || typeof raw.message !== 'string') return null

  return {
    id: `review-${index}`,
    filePath: typeof raw.filePath === 'string' ? raw.filePath : 'unknown',
    lineStart: typeof raw.lineStart === 'number' ? raw.lineStart : 0,
    lineEnd: typeof raw.lineEnd === 'number' ? raw.lineEnd : typeof raw.lineStart === 'number' ? raw.lineStart : 0,
    severity: isValidSeverity(raw.severity) ? raw.severity : 'info',
    message: raw.message,
    suggestion: typeof raw.suggestion === 'string' ? raw.suggestion : undefined,
  }
}

export class ClaudeDefaultOutputParser implements ClaudeOutputParser {
  parseReviewComments(output: string): { comments: ReviewComment[]; summary: string } {
    const jsonStr = extractJsonBlock(output)
    if (!jsonStr) {
      return { comments: [], summary: output.trim() }
    }

    try {
      const parsed: RawReviewResult = JSON.parse(jsonStr)
      const comments: ReviewComment[] = []

      if (Array.isArray(parsed.comments)) {
        for (let i = 0; i < parsed.comments.length; i++) {
          const comment = sanitizeComment(parsed.comments[i], i)
          if (comment) {
            comments.push(comment)
          }
        }
      }

      const summary = typeof parsed.summary === 'string' ? parsed.summary : ''
      return { comments, summary }
    } catch {
      // JSON パース失敗時はフォールバック
      return { comments: [], summary: output.trim() }
    }
  }

  parseExplanation(output: string): string {
    return output.trim()
  }
}
