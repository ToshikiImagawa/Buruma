import type { StashEntry } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class StashListUseCase implements FunctionUseCase<string, Promise<StashEntry[]>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(worktreePath: string): Promise<StashEntry[]> {
    return this.repository.stashList(worktreePath)
  }
}
