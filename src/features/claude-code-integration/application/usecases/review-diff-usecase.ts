import type { DiffTarget } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeStateService } from '../services/claude-state-service-interface'

export interface ReviewDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ReviewDiffUseCase implements ConsumerUseCase<ReviewDiffInput> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly state: ClaudeStateService,
  ) {}

  async invoke(input: ReviewDiffInput): Promise<void> {
    this.state.setReviewing(true)
    try {
      await this.repository.reviewDiff(input.worktreePath, input.diffTarget, input.diffText)
    } catch (error) {
      this.state.setReviewing(false)
      throw error
    }
  }
}
