import type { AppSettings } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { StoreRepository } from '../repositories/types'

export class UpdateSettingsMainUseCase implements ConsumerUseCase<Partial<AppSettings>> {
  constructor(private readonly store: StoreRepository) {}

  invoke(partial: Partial<AppSettings>): void {
    const current = this.store.getSettings()
    this.store.setSettings({ ...current, ...partial })
  }
}
