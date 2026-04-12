import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { WorktreeDeleteParams } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'

export class DeleteWorktreeDefaultUseCase implements ConsumerUseCase<WorktreeDeleteParams> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly service: WorktreeService,
    private readonly errorService: ErrorNotificationService,
  ) {}

  invoke(params: WorktreeDeleteParams): void {
    this.repo
      .delete(params)
      .then(() => this.repo.list(params.repoPath))
      .then((worktrees) => this.service.updateWorktrees(worktrees))
      .catch((error: unknown) => {
        const isWorktreeDirty =
          !params.force &&
          error instanceof Error &&
          'code' in error &&
          (error as { code: string }).code === 'WORKTREE_DIRTY'

        if (isWorktreeDirty) {
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
}
