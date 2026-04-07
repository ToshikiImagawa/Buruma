import type { ReviewComment } from '@domain'

export interface ClaudeOutputParser {
  parseReviewComments(output: string): { comments: ReviewComment[]; summary: string }
  parseExplanation(output: string): string
}
