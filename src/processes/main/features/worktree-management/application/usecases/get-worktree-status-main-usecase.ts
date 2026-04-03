import type { WorktreeStatus } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../repositories/worktree-git-repository'

export class GetWorktreeStatusMainUseCase implements FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
> {
  constructor(private readonly gitRepository: WorktreeGitRepository) {}

  async invoke(params: { repoPath: string; worktreePath: string }): Promise<WorktreeStatus> {
    return this.gitRepository.getStatus(params.worktreePath)
  }
}
