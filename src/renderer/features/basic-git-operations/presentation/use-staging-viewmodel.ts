import { useCallback } from 'react'
import { useResolve } from '@shared/lib/di/v-container-provider'
import { useObservable } from '@shared/lib/hooks/use-observable'
import { StagingViewModelToken } from '../di-tokens'

export function useStagingViewModel() {
  const vm = useResolve(StagingViewModelToken)
  const loading = useObservable(vm.loading$, false)

  return {
    loading,
    stageFiles: useCallback((worktreePath: string, files: string[]) => vm.stageFiles(worktreePath, files), [vm]),
    unstageFiles: useCallback((worktreePath: string, files: string[]) => vm.unstageFiles(worktreePath, files), [vm]),
    stageAll: useCallback((worktreePath: string) => vm.stageAll(worktreePath), [vm]),
    unstageAll: useCallback((worktreePath: string) => vm.unstageAll(worktreePath), [vm]),
  }
}
