import type { ConsumerUseCase } from '@/lib/usecase'
import type { RepositoryRepository, IRepositoryService } from '../../di-tokens'

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
