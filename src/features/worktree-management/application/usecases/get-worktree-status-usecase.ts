import type { WorktreeStatus } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'

export class GetWorktreeStatusDefaultUseCase implements FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
> {
  constructor(private readonly repo: WorktreeRepository) {}

  invoke(arg: { repoPath: string; worktreePath: string }): Promise<WorktreeStatus> {
    return this.repo.getStatus(arg.repoPath, arg.worktreePath)
  }
}
