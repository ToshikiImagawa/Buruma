import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { IPCError } from '@shared/types/ipc'
import type { Observable } from 'rxjs'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class GetLastErrorUseCase implements ObservableStoreUseCase<IPCError | null> {
  constructor(private readonly service: GitOperationsService) {}

  get store(): Observable<IPCError | null> {
    return this.service.lastError$
  }
}
