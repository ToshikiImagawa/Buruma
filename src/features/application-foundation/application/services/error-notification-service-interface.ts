import type { ErrorNotification, ErrorSeverity } from '@domain'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

export interface ErrorNotificationService extends BaseService {
  readonly notifications$: Observable<ErrorNotification[]>
  addNotification(notification: ErrorNotification): void
  notifyError(
    title: string,
    error: unknown,
    options?: { severity?: ErrorSeverity; retryable?: boolean; retryAction?: string },
  ): void
  removeNotification(id: string): void
  clear(): void
}
