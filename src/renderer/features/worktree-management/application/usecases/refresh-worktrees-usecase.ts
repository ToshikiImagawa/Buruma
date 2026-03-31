import type { RunnableUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'

export class RefreshWorktreesDefaultUseCase implements RunnableUseCase {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
    private readonly getRepoPath: () => string | null,
  ) {}

  invoke(): void {
    const repoPath = this.getRepoPath()
    if (!repoPath) return

    this.repo
      .list(repoPath)
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch((error: unknown) => {
        console.error('[worktree]', error)
      })
  }
}
