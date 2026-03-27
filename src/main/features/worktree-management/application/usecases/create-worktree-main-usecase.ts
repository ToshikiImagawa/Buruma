import type { WorktreeCreateParams, WorktreeInfo } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService } from '../worktree-interfaces'

export class CreateWorktreeMainUseCase implements FunctionUseCase<WorktreeCreateParams, Promise<WorktreeInfo>> {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async invoke(params: WorktreeCreateParams): Promise<WorktreeInfo> {
    return this.gitService.addWorktree(params)
  }
}
