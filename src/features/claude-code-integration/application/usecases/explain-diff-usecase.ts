import type { DiffTarget } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeStateService } from '../services/claude-state-service-interface'

export interface ExplainDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ExplainDiffUseCase implements ConsumerUseCase<ExplainDiffInput> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly state: ClaudeStateService,
  ) {}

  async invoke(input: ExplainDiffInput): Promise<void> {
    this.state.setExplaining(true)
    try {
      await this.repository.explainDiff(input.worktreePath, input.diffTarget, input.diffText)
    } catch (error) {
      this.state.setExplaining(false)
      throw error
    }
  }
}
