import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class StashClearUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: string): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .stashClear(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'STASH_CLEAR_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
