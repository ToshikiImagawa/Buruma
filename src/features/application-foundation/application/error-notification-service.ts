import { BehaviorSubject, Observable } from 'rxjs'
import type { ErrorNotification } from '../domain'
import type { IErrorNotificationService } from '../di-tokens'

export class ErrorNotificationService implements IErrorNotificationService {
  private readonly _notifications$ = new BehaviorSubject<ErrorNotification[]>([])

  get notifications$(): Observable<ErrorNotification[]> {
    return this._notifications$.asObservable()
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

  dispose(): void {
    this._notifications$.complete()
  }
}
