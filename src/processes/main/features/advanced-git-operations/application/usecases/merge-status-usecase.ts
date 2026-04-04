import type { MergeStatus } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class MergeStatusUseCase implements FunctionUseCase<string, Promise<MergeStatus>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(worktreePath: string): Promise<MergeStatus> {
    return this.repository.mergeStatus(worktreePath)
  }
}
