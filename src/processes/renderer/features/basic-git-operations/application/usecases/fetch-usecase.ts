import type { FetchArgs, FetchResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class FetchUseCase implements FunctionUseCase<FetchArgs, Promise<FetchResult>> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: FetchArgs): Promise<FetchResult> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .fetch(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
