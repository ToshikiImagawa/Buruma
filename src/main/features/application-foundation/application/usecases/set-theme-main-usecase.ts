import type { Theme } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { IStoreRepository } from '../repositories/types'

export class SetThemeMainUseCase implements ConsumerUseCase<Theme> {
  constructor(private readonly store: IStoreRepository) {}

  invoke(theme: Theme): void {
    const current = this.store.getSettings()
    this.store.setSettings({ ...current, theme })
  }
}
