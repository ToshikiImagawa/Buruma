import type { AppSettings, Theme } from '@domain'
import type { SettingsRepository } from '../../application/repositories/settings-repository'
import { invokeCommand } from '@lib/invoke/commands'

export class SettingsDefaultRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const result = await invokeCommand<AppSettings>('settings_get')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async update(settings: Partial<AppSettings>): Promise<void> {
    const result = await invokeCommand<void>('settings_set', { settings })
    if (result.success === false) throw new Error(result.error.message)
  }

  async getTheme(): Promise<Theme> {
    const result = await invokeCommand<Theme>('settings_get_theme')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async setTheme(theme: Theme): Promise<void> {
    const result = await invokeCommand<void>('settings_set_theme', { theme })
    if (result.success === false) throw new Error(result.error.message)
  }
}
