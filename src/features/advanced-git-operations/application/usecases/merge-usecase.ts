import type { MergeOptions, MergeResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class MergeUseCase implements FunctionUseCase<MergeOptions, Promise<MergeResult>> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: MergeOptions): Promise<MergeResult> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .merge(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'MERGE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'merge' })
      })
  }
}
