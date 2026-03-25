import type { SettingsRepository } from '../di-tokens'
import type { AppSettings, Theme } from '../domain'

export class SettingsRepositoryImpl implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const result = await window.electronAPI.settings.get()
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async update(settings: Partial<AppSettings>): Promise<void> {
    const result = await window.electronAPI.settings.set(settings)
    if (result.success === false) throw new Error(result.error.message)
  }

  async getTheme(): Promise<Theme> {
    const result = await window.electronAPI.settings.getTheme()
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async setTheme(theme: Theme): Promise<void> {
    const result = await window.electronAPI.settings.setTheme(theme)
    if (result.success === false) throw new Error(result.error.message)
  }
}
