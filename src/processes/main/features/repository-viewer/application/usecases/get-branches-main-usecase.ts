import type { BranchList } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetBranchesMainUseCase implements FunctionUseCase<{ worktreePath: string }, Promise<BranchList>> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: { worktreePath: string }): Promise<BranchList> {
    return this.gitRepository.getBranches(input.worktreePath)
  }
}
