import type { Observable } from 'rxjs'
import type { ObservableStoreUseCase } from '@/lib/usecase'
import type { RecentRepository } from '../../domain'
import type { IRepositoryService } from '../../di-tokens'

export class GetRecentRepositoriesUseCaseImpl implements ObservableStoreUseCase<RecentRepository[]> {
  constructor(private readonly service: IRepositoryService) {}

  get store(): Observable<RecentRepository[]> {
    return this.service.recentRepositories$
  }
}
