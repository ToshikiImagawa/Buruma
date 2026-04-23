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
    // Rust の settings_set は完全な AppSettings を期待するため、
    // 現在の設定を取得してマージしてから保存する。
    // 注意: 並行呼び出し時は last-write-wins になる（設定変更は低頻度のため許容）。
    const current = await this.get()
    const merged = { ...current, ...settings }
    const result = await invokeCommand('settings_set', { settings: merged })
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

  async selectEditorApp(): Promise<string | null> {
    const result = await invokeCommand('select_external_editor_app', {})
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }
}
