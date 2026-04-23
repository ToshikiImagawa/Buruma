import type { ConsumerUseCase } from '@lib/usecase'
import type { ExternalAppRepository } from '../repositories/external-app-repository'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'

export class OpenFileInDefaultAppDefaultUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly externalAppRepo: ExternalAppRepository,
    private readonly errorService: ErrorNotificationService,
  ) {}

  invoke(path: string): void {
    this.externalAppRepo.openPath(path).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      this.errorService.addNotification({
        id: crypto.randomUUID(),
        severity: 'error',
        title: 'ファイルを開けませんでした',
        message,
        retryable: false,
        timestamp: new Date().toISOString(),
      })
    })
  }
}
