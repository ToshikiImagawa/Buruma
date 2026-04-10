import type { StashEntry } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class StashListUseCase implements FunctionUseCase<string, Promise<StashEntry[]>> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: string): Promise<StashEntry[]> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .stashList(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'STASH_LIST_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
