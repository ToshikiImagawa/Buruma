import type { MergeStatus } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class MergeStatusUseCase implements FunctionUseCase<string, Promise<MergeStatus>> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: string): Promise<MergeStatus> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .mergeStatus(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'MERGE_STATUS_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
