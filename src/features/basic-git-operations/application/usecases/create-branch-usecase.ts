import type { BranchCreateArgs } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class CreateBranchUseCase implements ConsumerUseCase<BranchCreateArgs> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: BranchCreateArgs): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .branchCreate(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'BRANCH_CREATE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'branch-create' })
      })
  }
}
