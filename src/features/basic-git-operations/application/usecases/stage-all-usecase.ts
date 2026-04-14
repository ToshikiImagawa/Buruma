import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class StageAllUseCase implements ConsumerUseCase<{ worktreePath: string }> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: { worktreePath: string }): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .stageAll(input.worktreePath)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'STAGE_ALL_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'stage' })
      })
  }
}
