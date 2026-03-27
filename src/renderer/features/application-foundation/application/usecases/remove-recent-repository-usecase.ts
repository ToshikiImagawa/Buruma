import type { ConsumerUseCase } from '@shared/lib/usecase'
import type { IRepositoryService, RepositoryRepository } from '../../di-tokens'

export class RemoveRecentRepositoryUseCaseImpl implements ConsumerUseCase<string> {
  constructor(
    private readonly repo: RepositoryRepository,
    private readonly service: IRepositoryService,
  ) {}

  invoke(path: string): void {
    this.repo.removeRecent(path).then(() => {
      this.repo.getRecent().then((recent) => {
        this.service.updateRecentRepositories(recent)
      })
    })
  }
}
