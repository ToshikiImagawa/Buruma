import type { PushArgs, PushResult } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class PushUseCase implements FunctionUseCase<PushArgs, Promise<PushResult>> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: PushArgs): Promise<PushResult> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .push(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'PUSH_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
