import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { SymlinkConfig } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'

export class SetSymlinkConfigDefaultUseCase implements FunctionUseCase<
  { repoPath: string; config: SymlinkConfig },
  Promise<void>
> {
  constructor(
    private readonly repo: WorktreeRepository,
    private readonly errorService: ErrorNotificationService,
  ) {}

  async invoke({ repoPath, config }: { repoPath: string; config: SymlinkConfig }): Promise<void> {
    try {
      await this.repo.setSymlinkConfig(repoPath, config)
    } catch (error: unknown) {
      this.errorService.notifyError('シンボリックリンク設定の保存に失敗しました', error)
      throw error
    }
  }
}
