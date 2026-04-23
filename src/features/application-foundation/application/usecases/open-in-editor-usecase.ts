import type { ConsumerUseCase } from '@lib/usecase'
import type { ExternalAppRepository } from '../repositories/external-app-repository'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'

export class OpenInEditorDefaultUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly externalAppRepo: ExternalAppRepository,
    private readonly errorService: ErrorNotificationService,
  ) {}

  invoke(path: string): void {
    this.externalAppRepo.openInEditor(path).catch((error: unknown) => {
      this.errorService.notifyError('エディタで開けませんでした', error)
    })
  }
}
