import type { ResetArgs } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class ResetUseCase implements ConsumerUseCase<ResetArgs> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: ResetArgs): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .reset(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'RESET_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
