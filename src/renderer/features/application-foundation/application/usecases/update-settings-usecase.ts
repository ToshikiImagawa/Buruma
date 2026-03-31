import type { AppSettings } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase'
import type { SettingsRepository } from '../repositories/settings-repository'
import type { ISettingsService } from '../services/settings-service-interface'

export class UpdateSettingsUseCaseImpl implements ConsumerUseCase<Partial<AppSettings>> {
  constructor(
    private readonly repo: SettingsRepository,
    private readonly service: ISettingsService,
  ) {}

  invoke(settings: Partial<AppSettings>): void {
    this.repo.update(settings).then(() => {
      this.service.updateSettings(settings)
    })
  }
}
