import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class UnstageAllUseCase implements ConsumerUseCase<{ worktreePath: string }> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: { worktreePath: string }): Promise<void> {
    await this.repository.unstageAll(input.worktreePath)
  }
}
