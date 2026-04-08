import type { PullArgs, PullResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class PullUseCase implements FunctionUseCase<PullArgs, Promise<PullResult>> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: PullArgs): Promise<PullResult> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .pull(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'PULL_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'pull' })
      })
  }
}
