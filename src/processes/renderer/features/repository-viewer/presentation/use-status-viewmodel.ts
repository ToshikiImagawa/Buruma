import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { StatusViewModelToken } from '../di-tokens'

export function useStatusViewModel() {
  const vm = useResolve(StatusViewModelToken)
  const status = useObservable(vm.status$, null)
  const loading = useObservable(vm.loading$, false)

  return {
    status,
    loading,
    loadStatus: useCallback((worktreePath: string) => vm.loadStatus(worktreePath), [vm]),
    selectFile: useCallback((filePath: string, staged: boolean) => vm.selectFile(filePath, staged), [vm]),
  }
}
