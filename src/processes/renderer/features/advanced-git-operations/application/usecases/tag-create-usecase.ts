import type { TagCreateOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class TagCreateUseCase implements ConsumerUseCase<TagCreateOptions> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: TagCreateOptions): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .tagCreate(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'TAG_CREATE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
