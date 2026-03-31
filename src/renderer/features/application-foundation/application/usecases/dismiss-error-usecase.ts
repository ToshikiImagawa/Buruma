import type { ConsumerUseCase } from '@shared/lib/usecase'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'

export class DismissErrorDefaultUseCase implements ConsumerUseCase<string> {
  constructor(private readonly service: ErrorNotificationService) {}

  invoke(errorId: string): void {
    this.service.removeNotification(errorId)
  }
}
