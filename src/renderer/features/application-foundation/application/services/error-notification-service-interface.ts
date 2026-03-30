import type { ErrorNotification } from '@shared/domain'
import type { BaseService } from '@shared/lib/service'
import type { Observable } from 'rxjs'

export interface IErrorNotificationService extends BaseService {
  readonly notifications$: Observable<ErrorNotification[]>
  addNotification(notification: ErrorNotification): void
  removeNotification(id: string): void
  clear(): void
}
