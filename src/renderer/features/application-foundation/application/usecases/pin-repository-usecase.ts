import type { ConsumerUseCase } from '@shared/lib/usecase'
import type { RepositoryRepository } from '../repositories/repository-repository'
import type { IRepositoryService } from '../services/repository-service-interface'

export class PinRepositoryUseCaseImpl implements ConsumerUseCase<{ path: string; pinned: boolean }> {
  constructor(
    private readonly repo: RepositoryRepository,
    private readonly service: IRepositoryService,
  ) {}

  invoke(arg: { path: string; pinned: boolean }): void {
    this.repo.pin(arg.path, arg.pinned).then(() => {
      this.repo.getRecent().then((recent) => {
        this.service.updateRecentRepositories(recent)
      })
    })
  }
}
