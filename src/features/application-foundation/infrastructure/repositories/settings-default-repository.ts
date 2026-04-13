import type { AppSettings, Theme } from '@domain'
import type { SettingsRepository } from '../../application/repositories/settings-repository'
import { invokeCommand } from '@lib/invoke/commands'

export class SettingsDefaultRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const result = await invokeCommand('settings_get')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async update(settings: Partial<AppSettings>): Promise<void> {
    const result = await invokeCommand('settings_set', { settings })
    if (result.success === false) throw new Error(result.error.message)
  }

  async getTheme(): Promise<Theme> {
    const result = await invokeCommand('settings_get_theme')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async setTheme(theme: Theme): Promise<void> {
    const result = await invokeCommand('settings_set_theme', { theme })
    if (result.success === false) throw new Error(result.error.message)
  }
}
