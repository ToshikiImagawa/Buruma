import type { WorktreeCreateParams, WorktreeInfo } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { WorktreeGitRepository } from '../repositories/worktree-git-repository'

export class CreateWorktreeMainUseCase implements FunctionUseCase<WorktreeCreateParams, Promise<WorktreeInfo>> {
  constructor(private readonly gitRepository: WorktreeGitRepository) {}

  async invoke(params: WorktreeCreateParams): Promise<WorktreeInfo> {
    return this.gitRepository.addWorktree(params)
  }
}
