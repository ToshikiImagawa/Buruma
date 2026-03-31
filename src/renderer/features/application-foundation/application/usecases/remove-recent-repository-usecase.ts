import type { ConsumerUseCase } from '@shared/lib/usecase'
import type { RepositoryRepository } from '../repositories/repository-repository'
import type { RepositoryService } from '../services/repository-service-interface'

export class RemoveRecentRepositoryDefaultUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly repo: RepositoryRepository,
    private readonly service: RepositoryService,
  ) {}

  invoke(path: string): void {
    this.repo.removeRecent(path).then(() => {
      this.repo.getRecent().then((recent) => {
        this.service.updateRecentRepositories(recent)
      })
    })
  }
}
