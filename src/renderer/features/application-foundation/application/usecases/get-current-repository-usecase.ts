import type { RepositoryInfo } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { Observable } from 'rxjs'
import type { IRepositoryService } from '../../di-tokens'

export class GetCurrentRepositoryUseCaseImpl implements ObservableStoreUseCase<RepositoryInfo | null> {
  constructor(private readonly service: IRepositoryService) {}

  get store(): Observable<RepositoryInfo | null> {
    return this.service.currentRepository$
  }
}
