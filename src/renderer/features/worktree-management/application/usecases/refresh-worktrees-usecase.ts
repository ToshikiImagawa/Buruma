import type { RunnableUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeService, WorktreeRepository } from '../../di-tokens'

export class RefreshWorktreesUseCaseImpl implements RunnableUseCase {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: IWorktreeService,
    private readonly getRepoPath: () => string | null,
  ) {}

  invoke(): void {
    const repoPath = this.getRepoPath()
    if (!repoPath) return

    this.repo
      .list(repoPath)
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch(() => {
        // エラーは ErrorNotificationService 経由でハンドリング（将来実装）
      })
  }
}
