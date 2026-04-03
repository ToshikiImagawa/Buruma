import type { RepositoryInfo } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { RepositoryService } from '../services/repository-service-interface'

export class GetCurrentRepositoryDefaultUseCase implements ObservableStoreUseCase<RepositoryInfo | null> {
  constructor(private readonly service: RepositoryService) {}

  get store(): Observable<RepositoryInfo | null> {
    return this.service.currentRepository$
  }
}
