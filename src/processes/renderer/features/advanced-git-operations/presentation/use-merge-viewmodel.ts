import { useCallback } from 'react'
import type { MergeOptions } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { MergeViewModelToken } from '../di-tokens'

export function useMergeViewModel() {
  const vm = useResolve(MergeViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const mergeResult = useObservable(vm.mergeResult$, null)
  const mergeStatus = useObservable(vm.mergeStatus$, null)

  return {
    loading,
    mergeResult,
    mergeStatus,
    merge: useCallback((options: MergeOptions) => vm.merge(options), [vm]),
    mergeAbort: useCallback((worktreePath: string) => vm.mergeAbort(worktreePath), [vm]),
    getMergeStatus: useCallback((worktreePath: string) => vm.getMergeStatus(worktreePath), [vm]),
  }
}
