import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class TagDeleteUseCase implements ConsumerUseCase<{ worktreePath: string; tagName: string }> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: { worktreePath: string; tagName: string }): Promise<void> {
    await this.repository.tagDelete(input.worktreePath, input.tagName)
  }
}
