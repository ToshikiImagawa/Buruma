import type { ThreeWayContent } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from '../repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class ConflictFileContentUseCase
  implements FunctionUseCase<{ worktreePath: string; filePath: string }, Promise<ThreeWayContent>>
{
  constructor(
    private readonly repository: AdvancedOperationsRepository,
    private readonly service: AdvancedOperationsService,
  ) {}

  invoke(input: { worktreePath: string; filePath: string }): Promise<ThreeWayContent> {
    this.service.setLoading(true)
    this.service.clearError()
    return this.repository
      .conflictFileContent(input.worktreePath, input.filePath)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'CONFLICT_FILE_CONTENT_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
        throw error
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
