import { useCallback } from 'react'
import { useResolve } from '@shared/lib/di'
import { useObservable } from '@shared/lib/hooks'
import { RepositorySelectorViewModelToken } from '../di-tokens'

export function useRepositorySelectorViewModel() {
  const vm = useResolve(RepositorySelectorViewModelToken)
  const recentRepositories = useObservable(vm.recentRepositories$, [])
  const currentRepository = useObservable(vm.currentRepository$, null)

  return {
    recentRepositories,
    currentRepository,
    openWithDialog: useCallback(() => vm.openWithDialog(), [vm]),
    openByPath: useCallback((path: string) => vm.openByPath(path), [vm]),
    removeRecent: useCallback((path: string) => vm.removeRecent(path), [vm]),
    pin: useCallback((path: string, pinned: boolean) => vm.pin(path, pinned), [vm]),
  }
}
