import type { Theme } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { StoreRepository } from '../repositories/types'

export class SetThemeMainUseCase implements ConsumerUseCase<Theme> {
  constructor(private readonly store: StoreRepository) {}

  invoke(theme: Theme): void {
    const current = this.store.getSettings()
    this.store.setSettings({ ...current, theme })
  }
}
