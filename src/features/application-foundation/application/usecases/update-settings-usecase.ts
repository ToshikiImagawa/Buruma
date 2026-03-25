import type { ConsumerUseCase } from '@/lib/usecase'
import type { ISettingsService, SettingsRepository } from '../../di-tokens'
import type { AppSettings } from '../../domain'

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
