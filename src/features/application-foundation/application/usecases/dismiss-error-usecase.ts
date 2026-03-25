import type { ConsumerUseCase } from '@/lib/usecase'
import type { IErrorNotificationService } from '../../di-tokens'

export class DismissErrorUseCaseImpl implements ConsumerUseCase<string> {
  constructor(private readonly service: IErrorNotificationService) {}

  invoke(errorId: string): void {
    this.service.removeNotification(errorId)
  }
}
