import { DEFAULT_SETTINGS } from '@shared/domain'
import { firstValueFrom } from 'rxjs'
import { describe, expect, it } from 'vitest'
import { SettingsService } from '../services/settings-service'

describe('SettingsService', () => {
  it('初期値は DEFAULT_SETTINGS', async () => {
    const service = new SettingsService()
    const value = await firstValueFrom(service.settings$)
    expect(value).toEqual(DEFAULT_SETTINGS)
  })

  it('updateSettings で部分更新される', async () => {
    const service = new SettingsService()
    service.updateSettings({ theme: 'dark' })
    const value = await firstValueFrom(service.settings$)
    expect(value).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark' })
  })

  it('replaceSettings で全体置換される', async () => {
    const service = new SettingsService()
    const newSettings = { theme: 'light' as const, gitPath: '/usr/bin/git', defaultWorkDir: '/home' }
    service.replaceSettings(newSettings)
    const value = await firstValueFrom(service.settings$)
    expect(value).toEqual(newSettings)
  })

  it('dispose で BehaviorSubject が complete される', () => {
    const service = new SettingsService()
    let completed = false
    service.settings$.subscribe({ complete: () => (completed = true) })
    service.tearDown()
    expect(completed).toBe(true)
  })
})
