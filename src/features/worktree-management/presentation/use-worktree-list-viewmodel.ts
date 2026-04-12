import { useCallback } from 'react'
import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeSortOrder } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { WorktreeListViewModelToken } from '../di-tokens'

export function useWorktreeListViewModel() {
  const vm = useResolve(WorktreeListViewModelToken)
  const worktrees = useObservable(vm.worktrees$, [])
  const selectedPath = useObservable(vm.selectedPath$, null)
  const recoveryRequest = useObservable(vm.recoveryRequest$, null)

  return {
    worktrees,
    selectedPath,
    recoveryRequest,
    selectWorktree: useCallback((path: string | null) => vm.selectWorktree(path), [vm]),
    createWorktree: useCallback((params: WorktreeCreateParams) => vm.createWorktree(params), [vm]),
    deleteWorktree: useCallback((params: WorktreeDeleteParams) => vm.deleteWorktree(params), [vm]),
    refreshWorktrees: useCallback(() => vm.refreshWorktrees(), [vm]),
    setSortOrder: useCallback((order: WorktreeSortOrder) => vm.setSortOrder(order), [vm]),
    getBranches: useCallback((worktreePath: string) => vm.getBranches(worktreePath), [vm]),
    suggestPath: useCallback((repoPath: string, branch: string) => vm.suggestPath(repoPath, branch), [vm]),
    dismissRecovery: useCallback(() => vm.dismissRecovery(), [vm]),
  }
}
