import { useCallback } from 'react'
import type { StashSaveOptions } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { StashViewModelToken } from '../di-tokens'

export function useStashViewModel() {
  const vm = useResolve(StashViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const stashes = useObservable(vm.stashes$, [])

  return {
    loading,
    stashes,
    stashSave: useCallback((options: StashSaveOptions) => vm.stashSave(options), [vm]),
    stashList: useCallback((worktreePath: string) => vm.stashList(worktreePath), [vm]),
    stashPop: useCallback(
      (worktreePath: string, index: number) => vm.stashPop(worktreePath, index),
      [vm],
    ),
    stashApply: useCallback(
      (worktreePath: string, index: number) => vm.stashApply(worktreePath, index),
      [vm],
    ),
    stashDrop: useCallback(
      (worktreePath: string, index: number) => vm.stashDrop(worktreePath, index),
      [vm],
    ),
    stashClear: useCallback((worktreePath: string) => vm.stashClear(worktreePath), [vm]),
  }
}
