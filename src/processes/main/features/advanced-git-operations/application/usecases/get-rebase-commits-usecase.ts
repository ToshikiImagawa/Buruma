import type { RebaseStep } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class GetRebaseCommitsUseCase implements FunctionUseCase<
  { worktreePath: string; onto: string },
  Promise<RebaseStep[]>
> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: { worktreePath: string; onto: string }): Promise<RebaseStep[]> {
    return this.repository.getRebaseCommits(input.worktreePath, input.onto)
  }
}
