import type { StashSaveOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class StashSaveUseCase implements ConsumerUseCase<StashSaveOptions> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: StashSaveOptions): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .stashSave(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'STASH_SAVE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'stash-save' })
      })
  }
}
