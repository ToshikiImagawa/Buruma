import type { WorktreeCreateParams } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'

export class CreateWorktreeDefaultUseCase implements ConsumerUseCase<WorktreeCreateParams> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
  ) {}

  invoke(params: WorktreeCreateParams): void {
    this.repo
      .create(params)
      .then(() => this.repo.list(params.repoPath))
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch((error: unknown) => {
        console.error('[worktree]', error)
      })
  }
}
