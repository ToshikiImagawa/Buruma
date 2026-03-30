import type { ConsumerUseCase } from '@shared/lib/usecase'
import type { RepositoryRepository } from '../repositories/repository-repository'
import type { IErrorNotificationService } from '../services/error-notification-service-interface'
import type { IRepositoryService } from '../services/repository-service-interface'

export class OpenRepositoryByPathUseCaseImpl implements ConsumerUseCase<string> {
  constructor(
    private readonly repo: RepositoryRepository,
    private readonly service: IRepositoryService,
    private readonly errorService: IErrorNotificationService,
  ) {}

  invoke(path: string): void {
    this.repo
      .openByPath(path)
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
          retryable: false,
          timestamp: new Date().toISOString(),
        })
      })
  }
}
