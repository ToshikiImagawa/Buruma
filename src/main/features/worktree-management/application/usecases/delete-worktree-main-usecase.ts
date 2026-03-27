import type { WorktreeDeleteParams } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService } from '../worktree-interfaces'

export class DeleteWorktreeMainUseCase implements FunctionUseCase<WorktreeDeleteParams, Promise<void>> {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async invoke(params: WorktreeDeleteParams): Promise<void> {
    const isMain = await this.gitService.isMainWorktree(params.worktreePath)
    if (isMain) {
      throw new Error('メインワークツリーは削除できません')
    }
    await this.gitService.removeWorktree(params.worktreePath, params.force)
  }
}
