import type { AppSettings, Theme } from '@shared/domain'

export interface SettingsRepository {
  get(): Promise<AppSettings>
  update(settings: Partial<AppSettings>): Promise<void>
  getTheme(): Promise<Theme>
  setTheme(theme: Theme): Promise<void>
}
