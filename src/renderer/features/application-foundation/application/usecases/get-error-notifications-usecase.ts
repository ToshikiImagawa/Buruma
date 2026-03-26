import type { ObservableStoreUseCase } from '@/shared/lib/usecase'
import type { Observable } from 'rxjs'
import type { IErrorNotificationService } from '../../di-tokens'
import type { ErrorNotification } from '@/shared/domain'

export class GetErrorNotificationsUseCaseImpl implements ObservableStoreUseCase<ErrorNotification[]> {
  constructor(private readonly service: IErrorNotificationService) {}

  get store(): Observable<ErrorNotification[]> {
    return this.service.notifications$
  }
}
