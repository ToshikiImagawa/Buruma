import type { CommitArgs, CommitResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class CommitUseCase implements FunctionUseCase<CommitArgs, Promise<CommitResult>> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: CommitArgs): Promise<CommitResult> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .commit(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'COMMIT_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
