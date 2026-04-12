import type { BranchList } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'

export class GetBranchesDefaultUseCase implements FunctionUseCase<string, Promise<BranchList>> {
  constructor(private readonly repo: WorktreeRepository) {}

  invoke(worktreePath: string): Promise<BranchList> {
    return this.repo.getBranches(worktreePath)
  }
}
