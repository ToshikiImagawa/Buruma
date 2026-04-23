import type { ConsumerUseCase } from '@lib/usecase'
import type { RepositoryRepository } from '../repositories/repository-repository'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'
import type { RepositoryService } from '../services/repository-service-interface'

export class OpenRepositoryByPathDefaultUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly repo: RepositoryRepository,
    private readonly service: RepositoryService,
    private readonly errorService: ErrorNotificationService,
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
        this.errorService.notifyError('リポジトリを開けませんでした', error)
      })
  }
}
