import type { IPCError } from '@lib/ipc'
import type { ObservableStoreUseCase } from '@lib/usecase/types'
import type { Observable } from 'rxjs'
import type { AdvancedOperationsService } from '../services/advanced-operations-service-interface'

export class GetLastErrorUseCase implements ObservableStoreUseCase<IPCError | null> {
  constructor(private readonly service: AdvancedOperationsService) {}

  get store(): Observable<IPCError | null> {
    return this.service.lastError$
  }
}
