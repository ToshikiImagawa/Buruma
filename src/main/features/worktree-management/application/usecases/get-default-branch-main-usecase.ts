import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitRepository } from '../repositories/worktree-git-repository'

export class GetDefaultBranchMainUseCase implements FunctionUseCase<string, Promise<string>> {
  constructor(private readonly gitRepository: IWorktreeGitRepository) {}

  async invoke(repoPath: string): Promise<string> {
    return this.gitRepository.getDefaultBranch(repoPath)
  }
}
