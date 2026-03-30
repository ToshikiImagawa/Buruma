import type { ErrorNotification } from '@shared/domain'
import type { IErrorNotificationService } from './error-notification-service-interface'
import { BehaviorSubject, Observable } from 'rxjs'

export class ErrorNotificationService implements IErrorNotificationService {
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
