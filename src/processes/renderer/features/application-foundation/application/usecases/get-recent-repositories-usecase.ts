import type { RecentRepository } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase'
import type { Observable } from 'rxjs'
import type { RepositoryService } from '../services/repository-service-interface'

export class GetRecentRepositoriesDefaultUseCase implements ObservableStoreUseCase<RecentRepository[]> {
  constructor(private readonly service: RepositoryService) {}

  get store(): Observable<RecentRepository[]> {
    return this.service.recentRepositories$
  }
}
