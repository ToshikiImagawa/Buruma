import type { IPCError } from '@lib/ipc'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

export interface GitOperationsService extends BaseService {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>
  setLoading(loading: boolean): void
  setError(error: IPCError | null): void
  clearError(): void
}
