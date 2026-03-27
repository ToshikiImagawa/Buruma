import type { WorktreeStatus } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository } from '../../di-tokens'

export class GetWorktreeStatusUseCaseImpl implements FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
> {
  constructor(private readonly repo: WorktreeRepository) {}

  invoke(arg: { repoPath: string; worktreePath: string }): Promise<WorktreeStatus> {
    return this.repo.getStatus(arg.repoPath, arg.worktreePath)
  }
}
