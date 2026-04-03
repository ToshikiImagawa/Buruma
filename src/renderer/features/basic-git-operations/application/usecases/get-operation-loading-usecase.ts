import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { Observable } from 'rxjs'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class GetOperationLoadingUseCase implements ObservableStoreUseCase<boolean> {
  constructor(private readonly service: GitOperationsService) {}

  get store(): Observable<boolean> {
    return this.service.loading$
  }
}
