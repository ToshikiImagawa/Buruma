import { BehaviorSubject, type Observable } from 'rxjs'
import type { IPCError } from '@lib/ipc'
import type { OperationProgress } from '@domain'
import type { AdvancedOperationsService } from './advanced-operations-service-interface'

export class AdvancedOperationsDefaultService implements AdvancedOperationsService {
  private readonly _loading$ = new BehaviorSubject<boolean>(false)
  private readonly _lastError$ = new BehaviorSubject<IPCError | null>(null)
  private readonly _operationProgress$ = new BehaviorSubject<OperationProgress | null>(null)
  private readonly _currentOperation$ = new BehaviorSubject<string | null>(null)

  readonly loading$: Observable<boolean> = this._loading$.asObservable()
  readonly lastError$: Observable<IPCError | null> = this._lastError$.asObservable()
  readonly operationProgress$: Observable<OperationProgress | null> =
    this._operationProgress$.asObservable()
  readonly currentOperation$: Observable<string | null> = this._currentOperation$.asObservable()

  setUp(): void {
    // 初期化
  }

  setLoading(loading: boolean): void {
    this._loading$.next(loading)
  }

  setError(error: IPCError | null): void {
    this._lastError$.next(error)
  }

  clearError(): void {
    this._lastError$.next(null)
  }

  setOperationProgress(progress: OperationProgress | null): void {
    this._operationProgress$.next(progress)
  }

  setCurrentOperation(operation: string | null): void {
    this._currentOperation$.next(operation)
  }

  tearDown(): void {
    this._loading$.complete()
    this._lastError$.complete()
    this._operationProgress$.complete()
    this._currentOperation$.complete()
  }
}
