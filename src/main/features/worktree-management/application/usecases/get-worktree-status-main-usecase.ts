import type { WorktreeStatus } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService } from '../worktree-interfaces'

export class GetWorktreeStatusMainUseCase implements FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
> {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async invoke(params: { repoPath: string; worktreePath: string }): Promise<WorktreeStatus> {
    return this.gitService.getStatus(params.worktreePath)
  }
}
