import type { AppSettings } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase'
import type { SettingsRepository } from '../repositories/settings-repository'
import type { SettingsService } from '../services/settings-service-interface'

export class UpdateSettingsDefaultUseCase implements ConsumerUseCase<Partial<AppSettings>> {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly service: SettingsService,
  ) {}

  invoke(settings: Partial<AppSettings>): void {
    this.service.updateSettings(settings)
    this.repo.update(settings).catch((e) => {
      console.error('[UpdateSettingsUseCase] repo.update failed:', e)
    })
  }
}
