import type { RecentRepository } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase'
import type { Observable } from 'rxjs'
import type { IRepositoryService } from '../../di-tokens'

export class GetRecentRepositoriesUseCaseImpl implements ObservableStoreUseCase<RecentRepository[]> {
  constructor(private readonly service: IRepositoryService) {}

  get store(): Observable<RecentRepository[]> {
    return this.service.recentRepositories$
  }
}
