import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class GetOperationLoadingUseCase implements ObservableStoreUseCase<boolean> {
  constructor(private readonly service: AdvancedOperationsService) {}

  get store(): Observable<boolean> {
    return this.service.loading$
  }
}
