import type { ErrorNotification } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase'
import type { Observable } from 'rxjs'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'

export class GetErrorNotificationsDefaultUseCase implements ObservableStoreUseCase<ErrorNotification[]> {
  constructor(private readonly service: ErrorNotificationService) {}

  get store(): Observable<ErrorNotification[]> {
    return this.service.notifications$
  }
}
