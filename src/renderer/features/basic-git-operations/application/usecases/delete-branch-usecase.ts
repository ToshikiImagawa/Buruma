import type { BranchDeleteArgs } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class DeleteBranchUseCase implements ConsumerUseCase<BranchDeleteArgs> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: BranchDeleteArgs): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .branchDelete(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'BRANCH_DELETE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
