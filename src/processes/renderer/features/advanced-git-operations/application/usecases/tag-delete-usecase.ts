import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class TagDeleteUseCase implements ConsumerUseCase<{ worktreePath: string; tagName: string }> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: { worktreePath: string; tagName: string }): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .tagDelete(input.worktreePath, input.tagName)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'TAG_DELETE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'tag-delete' })
      })
  }
}
