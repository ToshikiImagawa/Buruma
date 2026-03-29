import type { WorktreeDeleteParams } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { IWorktreeService } from '../services/worktree-service-interface'

export class DeleteWorktreeUseCaseImpl implements ConsumerUseCase<WorktreeDeleteParams> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: IWorktreeService,
  ) {}

  invoke(params: WorktreeDeleteParams): void {
    this.repo
      .delete(params)
      .then(() => this.repo.list(params.repoPath))
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch(() => {
        // エラーは ErrorNotificationService 経由でハンドリング（将来実装）
      })
  }
}
