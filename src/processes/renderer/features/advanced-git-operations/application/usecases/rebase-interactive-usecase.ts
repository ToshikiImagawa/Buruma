import type { InteractiveRebaseOptions, RebaseResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class RebaseInteractiveUseCase implements FunctionUseCase<InteractiveRebaseOptions, Promise<RebaseResult>> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: InteractiveRebaseOptions): Promise<RebaseResult> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .rebaseInteractive(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'REBASE_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'rebase' })
      })
  }
}
