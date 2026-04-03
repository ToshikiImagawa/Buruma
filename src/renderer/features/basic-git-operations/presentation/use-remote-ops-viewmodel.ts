import { useCallback } from 'react'
import { useResolve } from '@shared/lib/di/v-container-provider'
import { useObservable } from '@shared/lib/hooks/use-observable'
import { RemoteOpsViewModelToken } from '../di-tokens'

export function useRemoteOpsViewModel() {
  const vm = useResolve(RemoteOpsViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const lastError = useObservable(vm.lastError$, null)
  const lastPushResult = useObservable(vm.lastPushResult$, null)
  const lastPullResult = useObservable(vm.lastPullResult$, null)

  return {
    loading,
    lastError,
    lastPushResult,
    lastPullResult,
    push: useCallback(
      (worktreePath: string, remote?: string, branch?: string, setUpstream?: boolean) =>
        vm.push(worktreePath, remote, branch, setUpstream),
      [vm],
    ),
    pull: useCallback(
      (worktreePath: string, remote?: string, branch?: string) => vm.pull(worktreePath, remote, branch),
      [vm],
    ),
    fetch: useCallback((worktreePath: string, remote?: string) => vm.fetch(worktreePath, remote), [vm]),
  }
}
