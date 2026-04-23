import type { AppSettings, Theme } from '@domain'

export interface SettingsRepository {
  get(): Promise<AppSettings>
  update(settings: Partial<AppSettings>): Promise<void>
  getTheme(): Promise<Theme>
  setTheme(theme: Theme): Promise<void>
  selectEditorApp(): Promise<string | null>
}
