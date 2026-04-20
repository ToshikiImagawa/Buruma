import { useCallback } from 'react'
import type { InteractiveRebaseOptions, RebaseOptions } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { RebaseViewModelToken } from '../di-tokens'

export function useRebaseViewModel() {
  const vm = useResolve(RebaseViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const rebaseResult = useObservable(vm.rebaseResult$, null)
  const rebaseCommits = useObservable(vm.rebaseCommits$, [])
  const branches = useObservable(vm.branches$, null)

  return {
    loading,
    rebaseResult,
    rebaseCommits,
    branches,
    rebase: useCallback((options: RebaseOptions) => vm.rebase(options), [vm]),
    rebaseInteractive: useCallback((options: InteractiveRebaseOptions) => vm.rebaseInteractive(options), [vm]),
    rebaseAbort: useCallback((worktreePath: string) => vm.rebaseAbort(worktreePath), [vm]),
    rebaseContinue: useCallback((worktreePath: string) => vm.rebaseContinue(worktreePath), [vm]),
    getRebaseCommits: useCallback(
      (worktreePath: string, onto: string, upstream?: string) => vm.getRebaseCommits(worktreePath, onto, upstream),
      [vm],
    ),
    fetchBranches: useCallback((worktreePath: string) => vm.fetchBranches(worktreePath), [vm]),
    clearState: useCallback(() => vm.clearState(), [vm]),
  }
}
