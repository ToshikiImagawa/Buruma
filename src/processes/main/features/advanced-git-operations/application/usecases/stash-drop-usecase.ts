import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class StashDropUseCase implements ConsumerUseCase<{ worktreePath: string; index: number }> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: { worktreePath: string; index: number }): Promise<void> {
    await this.repository.stashDrop(input.worktreePath, input.index)
  }
}
