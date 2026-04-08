import type { GitOperationCompletedEvent } from '@domain'
import type { IPCError } from '@lib/ipc'
import type { Observable } from 'rxjs'
import type { GitOperationsService } from './git-operations-service-interface'
import { BehaviorSubject, Subject } from 'rxjs'

export class GitOperationsDefaultService implements GitOperationsService {
  private readonly _loading$ = new BehaviorSubject<boolean>(false)
  private readonly _lastError$ = new BehaviorSubject<IPCError | null>(null)
  private readonly _operationCompleted$ = new Subject<GitOperationCompletedEvent>()

  readonly loading$: Observable<boolean> = this._loading$.asObservable()
  readonly lastError$: Observable<IPCError | null> = this._lastError$.asObservable()
  readonly operationCompleted$: Observable<GitOperationCompletedEvent> = this._operationCompleted$.asObservable()

  setUp(): void {
    // 初期化（特に処理なし）
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

  notifyOperationCompleted(event: GitOperationCompletedEvent): void {
    this._operationCompleted$.next(event)
  }

  tearDown(): void {
    this._loading$.complete()
    this._lastError$.complete()
    this._operationCompleted$.complete()
  }
}
