import type { ErrorNotification } from '@domain'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

export interface ErrorNotificationService extends BaseService {
  readonly notifications$: Observable<ErrorNotification[]>
  addNotification(notification: ErrorNotification): void
  removeNotification(id: string): void
  clear(): void
}
