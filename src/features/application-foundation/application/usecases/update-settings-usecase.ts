import type { ConsumerUseCase } from '@/lib/usecase'
import type { AppSettings } from '../../domain'
import type { SettingsRepository, ISettingsService } from '../../di-tokens'

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
