import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class GetCurrentOperationUseCase implements ObservableStoreUseCase<string | null> {
  constructor(private readonly service: AdvancedOperationsService) {}

  get store(): Observable<string | null> {
    return this.service.currentOperation$
  }
}
