import type { RunnableUseCase } from '@/shared/lib/usecase'
import type { IErrorNotificationService, IRepositoryService, RepositoryRepository } from '../../di-tokens'

export class OpenRepositoryUseCaseImpl implements RunnableUseCase {
  constructor(
    private readonly repo: RepositoryRepository,
    private readonly service: IRepositoryService,
    private readonly errorService: IErrorNotificationService,
  ) {}

  invoke(): void {
    this.repo
      .open()
      .then((result) => {
        if (result) {
          this.service.setCurrentRepository(result)
          this.repo.getRecent().then((recent) => {
            this.service.updateRecentRepositories(recent)
          })
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        this.errorService.addNotification({
          id: crypto.randomUUID(),
          severity: 'error',
          title: 'リポジトリを開けませんでした',
          message,
          retryable: true,
          retryAction: 'repository:open',
          timestamp: new Date().toISOString(),
        })
      })
  }
}
