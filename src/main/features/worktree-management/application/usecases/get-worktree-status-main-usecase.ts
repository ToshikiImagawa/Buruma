import type { WorktreeStatus } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitRepository } from '../repositories/worktree-git-repository'

export class GetWorktreeStatusMainUseCase implements FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
> {
  constructor(private readonly gitRepository: IWorktreeGitRepository) {}

  async invoke(params: { repoPath: string; worktreePath: string }): Promise<WorktreeStatus> {
    return this.gitRepository.getStatus(params.worktreePath)
  }
}
