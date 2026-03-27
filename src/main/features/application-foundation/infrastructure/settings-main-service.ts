import type { AppSettings, Theme } from '@shared/domain'
import type { IPCResult } from '@shared/types/ipc'
import type { AppStore } from './store-schema'
import { ipcSuccess } from '@shared/types/ipc'

export class SettingsMainService {
  constructor(private readonly store: AppStore) {}

  async getAll(): Promise<IPCResult<AppSettings>> {
    const settings = this.store.get('settings')
    return ipcSuccess(settings)
  }

  async update(partial: Partial<AppSettings>): Promise<IPCResult<void>> {
    const current = this.store.get('settings')
    this.store.set('settings', { ...current, ...partial })
    return ipcSuccess(undefined)
  }

  async getTheme(): Promise<IPCResult<Theme>> {
    const settings = this.store.get('settings')
    return ipcSuccess(settings.theme)
  }

  async setTheme(theme: Theme): Promise<IPCResult<void>> {
    const current = this.store.get('settings')
    this.store.set('settings', { ...current, theme })
    return ipcSuccess(undefined)
  }
}
