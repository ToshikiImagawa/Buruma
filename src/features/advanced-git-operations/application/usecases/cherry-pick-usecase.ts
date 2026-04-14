import type { CherryPickOptions, CherryPickResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class CherryPickUseCase implements FunctionUseCase<CherryPickOptions, Promise<CherryPickResult>> {
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: CherryPickOptions): Promise<CherryPickResult> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .cherryPick(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'CHERRY_PICK_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'cherry-pick' })
      })
  }
}
