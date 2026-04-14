import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { RunnableUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'

export class RefreshWorktreesDefaultUseCase implements RunnableUseCase {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
    private readonly getRepoPath: () => string | null,
    private readonly errorService: ErrorNotificationService,
  ) {}

  invoke(): void {
    const repoPath = this.getRepoPath()
    if (!repoPath) return

    this.repo
      .list(repoPath)
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch((error: unknown) => {
        this.errorService.notifyError('ワークツリー一覧の更新に失敗しました', error, { severity: 'warning' })
      })
  }
}
