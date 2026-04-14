import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { WorktreeDeleteParams } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'
import { WORKTREE_ERROR_CODES, hasWorktreeErrorCode } from '../repositories/worktree-repository'

export class DeleteWorktreeDefaultUseCase implements ConsumerUseCase<WorktreeDeleteParams> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
    private readonly errorService: ErrorNotificationService,
  ) {}

  invoke(params: WorktreeDeleteParams): void {
    this.repo
      .delete(params)
      .then((branchResult) => {
        if (branchResult?.type === 'requireForce') {
          this.service.requestRecovery({
            title: 'ブランチの削除に失敗しました',
            message: `ブランチ "${branchResult.branchName}" は未マージです。強制削除しますか？`,
            confirmLabel: '強制削除',
            onConfirm: () => this.forceDeleteBranch(params.repoPath, branchResult.branchName),
          })
        }
        return this.refreshWorktrees(params.repoPath)
      })
      .catch((error: unknown) => {
        if (!params.force && hasWorktreeErrorCode(error, WORKTREE_ERROR_CODES.DIRTY)) {
          this.service.requestRecovery({
            title: 'ワークツリーの削除に失敗しました',
            message: '未コミットの変更があります。強制削除すると変更が失われます。',
            confirmLabel: '強制削除',
            onConfirm: () => this.invoke({ ...params, force: true }),
          })
        } else {
          this.errorService.notifyError('ワークツリーの削除に失敗しました', error)
        }
      })
  }

  /** 未マージブランチを -D で強制削除 */
  private forceDeleteBranch(repoPath: string, branchName: string): void {
    this.repo
      .forceDeleteBranch(repoPath, branchName)
      .then(() => this.refreshWorktrees(repoPath))
      .catch((error: unknown) => {
        this.errorService.notifyError('ブランチの強制削除に失敗しました', error)
      })
  }

  private refreshWorktrees(repoPath: string): Promise<void> {
    return this.repo.list(repoPath).then((worktrees) => this.service.updateWorktrees(worktrees))
  }
}
