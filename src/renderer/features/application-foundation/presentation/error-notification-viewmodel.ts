import type { ErrorNotification } from '@shared/domain'
import type { Observable } from 'rxjs'
import type { DismissErrorUseCase, GetErrorNotificationsUseCase, RetryErrorUseCase } from '../di-tokens'
import type { IErrorNotificationViewModel } from './viewmodel-interfaces'

export class ErrorNotificationViewModel implements IErrorNotificationViewModel {
  constructor(
    private readonly getNotificationsUseCase: GetErrorNotificationsUseCase,
    private readonly dismissUseCase: DismissErrorUseCase,
    private readonly retryUseCase: RetryErrorUseCase,
  ) {}

  get notifications$(): Observable<ErrorNotification[]> {
    return this.getNotificationsUseCase.store
  }

  dismiss(errorId: string): void {
    this.dismissUseCase.invoke(errorId)
  }

  retry(errorId: string): void {
    this.retryUseCase.invoke(errorId)
  }
}
