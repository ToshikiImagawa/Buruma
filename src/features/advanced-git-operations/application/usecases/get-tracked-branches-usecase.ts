import type { BranchList } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class GetTrackedBranchesUseCase implements FunctionUseCase<string, Promise<BranchList>> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(worktreePath: string): Promise<BranchList> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .getBranches(worktreePath)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'GET_BRANCHES_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
