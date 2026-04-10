import type { GitOperationCompletedEvent } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class ObserveOperationCompletedUseCase implements ObservableStoreUseCase<GitOperationCompletedEvent> {
  constructor(private readonly service: AdvancedOperationsService) {}

  get store(): Observable<GitOperationCompletedEvent> {
    return this.service.operationCompleted$
  }
}
