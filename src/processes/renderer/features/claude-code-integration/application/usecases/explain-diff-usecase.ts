import type { DiffTarget } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export interface ExplainDiffInput {
  worktreePath: string
  diffTarget: DiffTarget
  diffText: string
}

export class ExplainDiffUseCase implements ConsumerUseCase<ExplainDiffInput> {
  constructor(private readonly repository: ClaudeRepository) {}

  async invoke(input: ExplainDiffInput): Promise<void> {
    await this.repository.explainDiff(input.worktreePath, input.diffTarget, input.diffText)
  }
}
