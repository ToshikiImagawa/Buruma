import type { AppSettings } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase'
import type { SettingsRepository } from '../repositories/settings-repository'
import type { ErrorNotificationService } from '../services/error-notification-service-interface'
import type { SettingsService } from '../services/settings-service-interface'

export class UpdateSettingsDefaultUseCase implements ConsumerUseCase<Partial<AppSettings>> {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly service: SettingsService,
    private readonly errorService: ErrorNotificationService,
  ) {}

  invoke(settings: Partial<AppSettings>): void {
    this.service.updateSettings(settings)
    this.repo.update(settings).catch((error: unknown) => {
      this.errorService.notifyError('設定の保存に失敗しました', error)
    })
  }
}
