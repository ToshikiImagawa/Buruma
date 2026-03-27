import type { AppSettings, Theme } from '@shared/domain'
import type { IStoreRepository } from './repository-interfaces'

export class SettingsMainUseCase {
  constructor(private readonly store: IStoreRepository) {}

  getAll(): AppSettings {
    return this.store.getSettings()
  }

  update(partial: Partial<AppSettings>): void {
    const current = this.store.getSettings()
    this.store.setSettings({ ...current, ...partial })
  }

  getTheme(): Theme {
    return this.store.getSettings().theme
  }

  setTheme(theme: Theme): void {
    const current = this.store.getSettings()
    this.store.setSettings({ ...current, theme })
  }
}
