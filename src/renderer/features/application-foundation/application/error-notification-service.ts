import type { IErrorNotificationService } from '../di-tokens'
import type { ErrorNotification } from '@/shared/domain'
import { BehaviorSubject, Observable } from 'rxjs'

export class ErrorNotificationService implements IErrorNotificationService {
  private readonly _notifications$ = new BehaviorSubject<ErrorNotification[]>([])

  get notifications$(): Observable<ErrorNotification[]> {
    return this._notifications$.asObservable()
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
