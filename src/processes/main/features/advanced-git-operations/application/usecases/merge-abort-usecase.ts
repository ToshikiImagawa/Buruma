import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class MergeAbortUseCase implements ConsumerUseCase<string> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(worktreePath: string): Promise<void> {
    await this.repository.mergeAbort(worktreePath)
  }
}
