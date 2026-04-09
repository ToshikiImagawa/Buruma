import type { DiffTarget } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from '../services/claude-service-interface'

export interface ExplainDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ExplainDiffUseCase implements ConsumerUseCase<ExplainDiffInput> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly service: ClaudeService,
  ) {}

  async invoke(input: ExplainDiffInput): Promise<void> {
    this.service.setExplaining(true)
    try {
      await this.repository.explainDiff(input.worktreePath, input.diffTarget, input.diffText)
    } catch (error) {
      this.service.setExplaining(false)
      throw error
    }
  }
}
