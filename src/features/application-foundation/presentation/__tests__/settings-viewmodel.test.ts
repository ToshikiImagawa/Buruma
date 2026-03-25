import { describe, it, expect, vi } from 'vitest'
import { BehaviorSubject } from 'rxjs'
import { SettingsViewModel } from '../settings-viewmodel'
import type { GetSettingsUseCase, UpdateSettingsUseCase } from '../../di-tokens'
import type { AppSettings } from '../../domain'
import { DEFAULT_SETTINGS } from '../../domain'

function createMocks() {
  const settingsSubject = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS)

  const getSettingsUseCase: GetSettingsUseCase = {
    property: {
      value: DEFAULT_SETTINGS,
      asObservable: () => settingsSubject.asObservable(),
    },
  }
  const updateSettingsUseCase: UpdateSettingsUseCase = { invoke: vi.fn() }

  const vm = new SettingsViewModel(getSettingsUseCase, updateSettingsUseCase)

  return { vm, updateSettingsUseCase, settingsSubject }
}

describe('SettingsViewModel', () => {
  it('settings$ が UseCase の property を Observable で返す', () => {
    const { vm } = createMocks()
    const values: AppSettings[] = []
    vm.settings$.subscribe((v) => values.push(v))

    expect(values).toHaveLength(1)
    expect(values[0]).toEqual(DEFAULT_SETTINGS)
  })

  it('updateSettings が UseCase を呼ぶ', () => {
    const { vm, updateSettingsUseCase } = createMocks()
    vm.updateSettings({ theme: 'dark' })
    expect(updateSettingsUseCase.invoke).toHaveBeenCalledWith({ theme: 'dark' })
  })

  it('setTheme が theme を含む partial で UseCase を呼ぶ', () => {
    const { vm, updateSettingsUseCase } = createMocks()
    vm.setTheme('light')
    expect(updateSettingsUseCase.invoke).toHaveBeenCalledWith({ theme: 'light' })
  })
})
