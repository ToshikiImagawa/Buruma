import type { GitOperationCompletedEvent } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class ObserveOperationCompletedUseCase implements ObservableStoreUseCase<GitOperationCompletedEvent> {
  constructor(private readonly service: GitOperationsService) {}

  get store(): Observable<GitOperationCompletedEvent> {
    return this.service.operationCompleted$
  }
}
