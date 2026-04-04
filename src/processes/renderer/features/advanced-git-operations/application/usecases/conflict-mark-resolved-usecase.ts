import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class ConflictMarkResolvedUseCase
  implements ConsumerUseCase<{ worktreePath: string; filePath: string }>
{
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: { worktreePath: string; filePath: string }): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .conflictMarkResolved(input.worktreePath, input.filePath)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'CONFLICT_MARK_RESOLVED_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
