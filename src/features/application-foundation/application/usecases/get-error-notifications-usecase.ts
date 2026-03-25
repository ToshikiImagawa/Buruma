import type { Observable } from 'rxjs'
import type { ObservableStoreUseCase } from '@/lib/usecase'
import type { ErrorNotification } from '../../domain'
import type { IErrorNotificationService } from '../../di-tokens'

export class GetErrorNotificationsUseCaseImpl implements ObservableStoreUseCase<ErrorNotification[]> {
  constructor(private readonly service: IErrorNotificationService) {}

  get store(): Observable<ErrorNotification[]> {
    return this.service.notifications$
  }
}
