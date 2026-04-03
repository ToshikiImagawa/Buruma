import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../repositories/worktree-git-repository'

export class GetDefaultBranchMainUseCase implements FunctionUseCase<string, Promise<string>> {
  constructor(private readonly gitRepository: WorktreeGitRepository) {}

  async invoke(repoPath: string): Promise<string> {
    return this.gitRepository.getDefaultBranch(repoPath)
  }
}
