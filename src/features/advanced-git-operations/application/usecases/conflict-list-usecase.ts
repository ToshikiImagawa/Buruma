import type { ConflictFile } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class ConflictListUseCase implements FunctionUseCase<string, Promise<ConflictFile[]>> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: string): Promise<ConflictFile[]> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .conflictList(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'CONFLICT_LIST_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
