import type { ConsumerUseCase } from '@shared/lib/usecase'
import type { IErrorNotificationService } from '../services/error-notification-service-interface'

export class DismissErrorUseCaseImpl implements ConsumerUseCase<string> {
  constructor(private readonly service: IErrorNotificationService) {}

  invoke(errorId: string): void {
    this.service.removeNotification(errorId)
  }
}
