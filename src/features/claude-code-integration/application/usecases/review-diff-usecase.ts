import type { DiffTarget } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from '../services/claude-service-interface'

export interface ReviewDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ReviewDiffUseCase implements ConsumerUseCase<ReviewDiffInput> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly service: ClaudeService,
  ) {}

  async invoke(input: ReviewDiffInput): Promise<void> {
    this.service.setReviewing(true)
    try {
      await this.repository.reviewDiff(input.worktreePath, input.diffTarget, input.diffText)
    } catch (error) {
      this.service.setReviewing(false)
      throw error
    }
  }
}
