import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { BranchDeleteArgs } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'
import { GIT_OPERATIONS_ERROR_CODES, hasGitOperationsErrorCode } from '../repositories/git-operations-repository'

export class DeleteBranchUseCase implements ConsumerUseCase<BranchDeleteArgs> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
    private readonly errorService: ErrorNotificationService,
  ) {}

  invoke(input: BranchDeleteArgs): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .branchDelete(input)
      .catch((error: unknown) => {
        if (hasGitOperationsErrorCode(error, GIT_OPERATIONS_ERROR_CODES.BRANCH_NOT_MERGED)) {
          this.service.setError({
            code: GIT_OPERATIONS_ERROR_CODES.BRANCH_NOT_MERGED,
            message: error instanceof Error ? error.message : String(error),
          })
        } else {
          this.errorService.notifyError('ブランチの削除に失敗しました', error)
        }
      })
      .finally(() => {
        this.service.setLoading(false)
        this.service.notifyOperationCompleted({ worktreePath: input.worktreePath, operation: 'branch-delete' })
      })
  }
}
