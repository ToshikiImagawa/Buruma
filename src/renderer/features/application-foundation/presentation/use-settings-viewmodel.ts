import { useCallback } from 'react'
import type { AppSettings, Theme } from '@shared/domain'
import { DEFAULT_SETTINGS } from '@shared/domain'
import { useResolve } from '@shared/lib/di'
import { useObservable } from '@shared/lib/hooks'
import { SettingsViewModelToken } from '../di-tokens'

export function useSettingsViewModel() {
  const vm = useResolve(SettingsViewModelToken)
  const settings = useObservable(vm.settings$, DEFAULT_SETTINGS)

  return {
    settings,
    updateSettings: useCallback((s: Partial<AppSettings>) => vm.updateSettings(s), [vm]),
    setTheme: useCallback((theme: Theme) => vm.setTheme(theme), [vm]),
  }
}
