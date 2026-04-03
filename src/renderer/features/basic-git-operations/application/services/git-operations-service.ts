import type { IPCError } from '@shared/types/ipc'
import type { Observable } from 'rxjs'
import type { GitOperationsService } from './git-operations-service-interface'
import { BehaviorSubject } from 'rxjs'

export class GitOperationsDefaultService implements GitOperationsService {
  private readonly _loading$ = new BehaviorSubject<boolean>(false)
  private readonly _lastError$ = new BehaviorSubject<IPCError | null>(null)

  readonly loading$: Observable<boolean> = this._loading$.asObservable()
  readonly lastError$: Observable<IPCError | null> = this._lastError$.asObservable()

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

  tearDown(): void {
    this._loading$.complete()
    this._lastError$.complete()
  }
}
