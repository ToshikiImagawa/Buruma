import type { BaseService } from '@shared/lib/service'
import type { IPCError } from '@shared/types/ipc'
import type { Observable } from 'rxjs'

export interface GitOperationsService extends BaseService {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>
  setLoading(loading: boolean): void
  setError(error: IPCError | null): void
  clearError(): void
}
