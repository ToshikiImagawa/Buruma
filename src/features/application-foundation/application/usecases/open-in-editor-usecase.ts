import type { ConsumerUseCase } from '@lib/usecase'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'
import { invokeCommand } from '@lib/invoke/commands'

export class OpenInEditorDefaultUseCase implements ConsumerUseCase<string> {
  constructor(private readonly errorService: ErrorNotificationService) {}

  invoke(path: string): void {
    invokeCommand('open_in_editor', { path }).then((result) => {
      if (result.success === false) {
        this.errorService.addNotification({
          id: crypto.randomUUID(),
          severity: 'error',
          title: 'エディタで開けませんでした',
          message: result.error.message,
          retryable: false,
          timestamp: new Date().toISOString(),
        })
      }
    })
  }
}
