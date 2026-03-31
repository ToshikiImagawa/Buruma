import type { WorktreeDeleteParams } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'

export class DeleteWorktreeDefaultUseCase implements ConsumerUseCase<WorktreeDeleteParams> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
  ) {}

  invoke(params: WorktreeDeleteParams): void {
    this.repo
      .delete(params)
      .then(() => this.repo.list(params.repoPath))
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch((error: unknown) => {
        console.error('[worktree]', error)
      })
  }
}
