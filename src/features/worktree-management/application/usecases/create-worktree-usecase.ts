import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { WorktreeCreateParams, WorktreeCreateResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'

export class CreateWorktreeDefaultUseCase implements FunctionUseCase<
  WorktreeCreateParams,
  Promise<WorktreeCreateResult>
> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
    private readonly errorService: ErrorNotificationService,
  ) {}

  async invoke(params: WorktreeCreateParams): Promise<WorktreeCreateResult> {
    try {
      const result = await this.repo.create(params)
      const worktrees = await this.repo.list(params.repoPath)
      this.service.updateWorktrees(worktrees)
      return result
    } catch (error: unknown) {
      this.errorService.notifyError('ワークツリーの作成に失敗しました', error)
      throw error
    }
  }
}
