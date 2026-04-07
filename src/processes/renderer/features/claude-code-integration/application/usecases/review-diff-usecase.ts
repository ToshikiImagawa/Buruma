import type { DiffTarget } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export interface ReviewDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ReviewDiffUseCase implements ConsumerUseCase<ReviewDiffInput> {
  constructor(private readonly repository: ClaudeRepository) {}

  async invoke(input: ReviewDiffInput): Promise<void> {
    await this.repository.reviewDiff(input.worktreePath, input.diffTarget, input.diffText)
  }
}
