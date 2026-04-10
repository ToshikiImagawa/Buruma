import type { RunnableUseCase } from '@lib/usecase'
import type { RepositoryRepository } from '../repositories/repository-repository'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'
import type { RepositoryService } from '../services/repository-service-interface'

export class OpenRepositoryDefaultUseCase implements RunnableUseCase {
  constructor(
    private readonly repo: RepositoryRepository,
    private readonly service: RepositoryService,
    private readonly errorService: ErrorNotificationService,
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
