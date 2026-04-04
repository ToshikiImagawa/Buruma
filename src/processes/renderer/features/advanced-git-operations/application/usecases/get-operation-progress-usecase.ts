import type { OperationProgress } from '@domain'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class GetOperationProgressUseCase implements ObservableStoreUseCase<OperationProgress | null> {
  constructor(private readonly service: AdvancedOperationsService) {}

  get store(): Observable<OperationProgress | null> {
    return this.service.operationProgress$
  }
}
