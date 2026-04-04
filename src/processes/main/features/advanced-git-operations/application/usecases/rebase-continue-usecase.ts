import type { RebaseResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class RebaseContinueUseCase implements FunctionUseCase<string, Promise<RebaseResult>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(worktreePath: string): Promise<RebaseResult> {
    return this.repository.rebaseContinue(worktreePath)
  }
}
