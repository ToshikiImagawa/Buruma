import type { WorktreeInfo } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../repositories/worktree-git-repository'

export class ListWorktreesMainUseCase implements FunctionUseCase<string, Promise<WorktreeInfo[]>> {
  constructor(private readonly gitRepository: WorktreeGitRepository) {}

  async invoke(repoPath: string): Promise<WorktreeInfo[]> {
    const worktrees = await this.gitRepository.listWorktrees(repoPath)
    return Promise.all(
      worktrees.map(async (wt) => ({
        ...wt,
        isDirty: await this.gitRepository.isDirty(wt.path),
      })),
    )
  }
}
