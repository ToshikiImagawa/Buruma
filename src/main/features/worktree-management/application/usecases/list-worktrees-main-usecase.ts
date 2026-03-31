import type { WorktreeInfo } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitRepository } from '../repositories/worktree-git-repository'

export class ListWorktreesMainUseCase implements FunctionUseCase<string, Promise<WorktreeInfo[]>> {
  constructor(private readonly gitRepository: IWorktreeGitRepository) {}

  async invoke(repoPath: string): Promise<WorktreeInfo[]> {
    const worktrees = await this.gitRepository.listWorktrees(repoPath)
    const results = await Promise.all(
      worktrees.map(async (wt) => ({
        ...wt,
        isDirty: await this.gitRepository.isDirty(wt.path),
      })),
    )
    return results
  }
}
