import { useCallback, useEffect } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { SymlinkSettingsViewModelToken } from '../di-tokens'

export function useSymlinkSettingsViewModel(repoPath: string | null) {
  const vm = useResolve(SymlinkSettingsViewModelToken)
  const config = useObservable(vm.config$, null)

  useEffect(() => {
    if (repoPath) {
      vm.loadConfig(repoPath)
    }
  }, [repoPath, vm])

  return {
    config,
    addPattern: useCallback((pattern: string) => repoPath && vm.addPattern(repoPath, pattern), [repoPath, vm]),
    removePattern: useCallback((index: number) => repoPath && vm.removePattern(repoPath, index), [repoPath, vm]),
  }
}
