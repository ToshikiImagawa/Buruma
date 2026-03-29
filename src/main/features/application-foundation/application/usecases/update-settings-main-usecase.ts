import type { AppSettings } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { IStoreRepository } from '../repository-interfaces'

export class UpdateSettingsMainUseCase implements ConsumerUseCase<Partial<AppSettings>> {
  constructor(private readonly store: IStoreRepository) {}

  invoke(partial: Partial<AppSettings>): void {
    const current = this.store.getSettings()
    this.store.setSettings({ ...current, ...partial })
  }
}
