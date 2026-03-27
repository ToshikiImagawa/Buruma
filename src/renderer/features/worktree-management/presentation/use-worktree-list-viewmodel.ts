import { useCallback } from 'react'
import { useResolve } from '@shared/lib/di/v-container-provider'
import { useObservable } from '@shared/lib/hooks/use-observable'
import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeSortOrder } from '@shared/domain'
import { WorktreeListViewModelToken } from '../di-tokens'

export function useWorktreeListViewModel() {
  const vm = useResolve(WorktreeListViewModelToken)
  const worktrees = useObservable(vm.worktrees$, [])
  const selectedPath = useObservable(vm.selectedPath$, null)

  return {
    worktrees,
    selectedPath,
    selectWorktree: useCallback((path: string | null) => vm.selectWorktree(path), [vm]),
    createWorktree: useCallback(
      (params: WorktreeCreateParams) => vm.createWorktree(params),
      [vm],
    ),
    deleteWorktree: useCallback(
      (params: WorktreeDeleteParams) => vm.deleteWorktree(params),
      [vm],
    ),
    refreshWorktrees: useCallback(() => vm.refreshWorktrees(), [vm]),
    setSortOrder: useCallback((order: WorktreeSortOrder) => vm.setSortOrder(order), [vm]),
  }
}
