import type { ErrorNotification, ErrorSeverity } from '@domain'
import type { ErrorNotificationService } from './error-notification-service-interface'
import { BehaviorSubject, Observable } from 'rxjs'

export class ErrorNotificationDefaultService implements ErrorNotificationService {
  private readonly _notifications$ = new BehaviorSubject<ErrorNotification[]>([])

  readonly notifications$: Observable<ErrorNotification[]>

  constructor() {
    this.notifications$ = this._notifications$.asObservable()
  }

  setUp(): void {
    // 初期化不要
  }

  addNotification(notification: ErrorNotification): void {
    this._notifications$.next([...this._notifications$.getValue(), notification])
  }

  notifyError(
    title: string,
    error: unknown,
    options?: { severity?: ErrorSeverity; retryable?: boolean; retryAction?: string },
  ): void {
    this.addNotification({
      id: crypto.randomUUID(),
      severity: options?.severity ?? 'error',
      title,
      message: error instanceof Error ? error.message : String(error),
      retryable: options?.retryable ?? false,
      retryAction: options?.retryAction,
      timestamp: new Date().toISOString(),
    })
  }

  removeNotification(id: string): void {
    this._notifications$.next(this._notifications$.getValue().filter((n) => n.id !== id))
  }

  clear(): void {
    this._notifications$.next([])
  }

  tearDown(): void {
    this._notifications$.complete()
  }
}
