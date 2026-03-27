import type { WorktreeInfo } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService } from '../worktree-interfaces'

export class ListWorktreesMainUseCase implements FunctionUseCase<string, Promise<WorktreeInfo[]>> {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async invoke(repoPath: string): Promise<WorktreeInfo[]> {
    const worktrees = await this.gitService.listWorktrees(repoPath)
    const results = await Promise.all(
      worktrees.map(async (wt) => ({
        ...wt,
        isDirty: await this.gitService.isDirty(wt.path),
      })),
    )
    return results
  }
}
