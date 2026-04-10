import type { ConflictResolveOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class ConflictResolveUseCase implements ConsumerUseCase<ConflictResolveOptions> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: ConflictResolveOptions): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .conflictResolve(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'CONFLICT_RESOLVE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'conflict-resolve' })
      })
  }
}
