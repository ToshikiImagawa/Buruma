import type { RebaseStep } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class GetRebaseCommitsUseCase
  implements FunctionUseCase<{ worktreePath: string; onto: string }, Promise<RebaseStep[]>>
{
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: { worktreePath: string; onto: string }): Promise<RebaseStep[]> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .getRebaseCommits(input.worktreePath, input.onto)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'REBASE_GET_COMMITS_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
