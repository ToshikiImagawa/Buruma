import type { DiffTarget, ReviewResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeOutputParser } from '../repositories/claude-output-parser'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'
import { buildReviewDiffPrompt } from '../prompts/review-diff'

export interface ReviewDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ReviewDiffMainUseCase implements FunctionUseCase<ReviewDiffInput, Promise<ReviewResult>> {
  constructor(
    private readonly processRepository: ClaudeProcessRepository,
    private readonly outputParser: ClaudeOutputParser,
  ) {}

  async invoke(input: ReviewDiffInput): Promise<ReviewResult> {
    if (!input.diffText.trim()) {
      return { worktreePath: input.worktreePath, comments: [], summary: 'レビュー対象の差分がありません' }
    }

    const prompt = buildReviewDiffPrompt(input.diffText)
    const rawOutput = await this.processRepository.generateText(input.worktreePath, prompt)
    const { comments, summary } = this.outputParser.parseReviewComments(rawOutput)

    return { worktreePath: input.worktreePath, comments, summary }
  }
}
