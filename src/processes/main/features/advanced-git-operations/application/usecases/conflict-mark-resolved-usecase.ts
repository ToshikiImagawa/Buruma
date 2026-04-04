import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class ConflictMarkResolvedUseCase implements ConsumerUseCase<{ worktreePath: string; filePath: string }> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: { worktreePath: string; filePath: string }): Promise<void> {
    await this.repository.conflictMarkResolved(input.worktreePath, input.filePath)
  }
}
