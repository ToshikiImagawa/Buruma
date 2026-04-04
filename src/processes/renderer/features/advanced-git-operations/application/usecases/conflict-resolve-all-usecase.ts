import type { ConflictResolveAllOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class ConflictResolveAllUseCase implements ConsumerUseCase<ConflictResolveAllOptions> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: ConflictResolveAllOptions): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .conflictResolveAll(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'CONFLICT_RESOLVE_ALL_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
