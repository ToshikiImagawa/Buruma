import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class StashPopUseCase implements ConsumerUseCase<{ worktreePath: string; index: number }> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: { worktreePath: string; index: number }): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .stashPop(input.worktreePath, input.index)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'STASH_POP_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
