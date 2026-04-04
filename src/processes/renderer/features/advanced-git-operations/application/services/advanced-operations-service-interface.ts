import type { Observable } from 'rxjs'
import type { BaseService } from '@lib/service'
import type { IPCError } from '@lib/ipc'
import type { OperationProgress } from '@domain'

export interface AdvancedOperationsService extends BaseService {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>
  readonly operationProgress$: Observable<OperationProgress | null>
  readonly currentOperation$: Observable<string | null>
  setLoading(loading: boolean): void
  setError(error: IPCError | null): void
  clearError(): void
  setOperationProgress(progress: OperationProgress | null): void
  setCurrentOperation(operation: string | null): void
}
