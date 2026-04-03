import type { WorktreeDeleteParams } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../repositories/worktree-git-repository'

export class DeleteWorktreeMainUseCase implements FunctionUseCase<WorktreeDeleteParams, Promise<void>> {
  constructor(private readonly gitRepository: WorktreeGitRepository) {}

  async invoke(params: WorktreeDeleteParams): Promise<void> {
    const isMain = await this.gitRepository.isMainWorktree(params.worktreePath)
    if (isMain) {
      throw new Error('メインワークツリーは削除できません')
    }
    await this.gitRepository.removeWorktree(params.worktreePath, params.force)
  }
}
