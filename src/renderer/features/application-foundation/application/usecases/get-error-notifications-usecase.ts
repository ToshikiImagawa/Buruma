import type { ErrorNotification } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase'
import type { Observable } from 'rxjs'
import type { IErrorNotificationService } from '../services/error-notification-service-interface'

export class GetErrorNotificationsUseCaseImpl implements ObservableStoreUseCase<ErrorNotification[]> {
  constructor(private readonly service: IErrorNotificationService) {}

  get store(): Observable<ErrorNotification[]> {
    return this.service.notifications$
  }
}
