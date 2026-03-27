import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService } from '../worktree-interfaces'

export class GetDefaultBranchMainUseCase implements FunctionUseCase<string, Promise<string>> {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async invoke(repoPath: string): Promise<string> {
    return this.gitService.getDefaultBranch(repoPath)
  }
}
