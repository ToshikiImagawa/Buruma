import type { WorktreeCreateParams } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository, IWorktreeService } from '../../di-tokens'

export class CreateWorktreeUseCaseImpl implements ConsumerUseCase<WorktreeCreateParams> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: IWorktreeService,
  ) {}

  invoke(params: WorktreeCreateParams): void {
    this.repo
      .create(params)
      .then(() => this.repo.list(params.repoPath))
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch(() => {
        // エラーは ErrorNotificationService 経由でハンドリング（将来実装）
      })
  }
}
