import { useCallback } from 'react'
import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeSortOrder } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { toast } from 'sonner'
import { WorktreeListViewModelToken } from '../di-tokens'

function formatSymlinkToast(created: number, skipped: number, failed: number): string {
  const parts: string[] = []
  if (created > 0) parts.push(`${created}件作成`)
  if (skipped > 0) parts.push(`${skipped}件スキップ`)
  if (failed > 0) parts.push(`${failed}件失敗`)
  return parts.length > 0 ? `シンボリックリンク: ${parts.join('、')}` : ''
}

export function useWorktreeListViewModel() {
  const vm = useResolve(WorktreeListViewModelToken)
  const worktrees = useObservable(vm.worktrees$, [])
  const selectedPath = useObservable(vm.selectedPath$, null)
  const recoveryRequest = useObservable(vm.recoveryRequest$, null)

  const createWorktree = useCallback(
    (params: WorktreeCreateParams) => {
      vm.createWorktree(params)
        .then((result) => {
          if (result.symlink) {
            const msg = formatSymlinkToast(
              result.symlink.totalCreated,
              result.symlink.totalSkipped,
              result.symlink.totalFailed,
            )
            if (msg) {
              if (result.symlink.totalFailed > 0) {
                toast.warning(msg)
              } else {
                toast.success(msg)
              }
            }
          }
        })
        .catch(() => {})
    },
    [vm],
  )

  return {
    worktrees,
    selectedPath,
    recoveryRequest,
    selectWorktree: useCallback((path: string | null) => vm.selectWorktree(path), [vm]),
    createWorktree,
    deleteWorktree: useCallback((params: WorktreeDeleteParams) => vm.deleteWorktree(params), [vm]),
    refreshWorktrees: useCallback(() => vm.refreshWorktrees(), [vm]),
    setSortOrder: useCallback((order: WorktreeSortOrder) => vm.setSortOrder(order), [vm]),
    getBranches: useCallback((worktreePath: string) => vm.getBranches(worktreePath), [vm]),
    getSymlinkConfig: useCallback((repoPath: string) => vm.getSymlinkConfig(repoPath), [vm]),
    suggestPath: useCallback((repoPath: string, branch: string) => vm.suggestPath(repoPath, branch), [vm]),
    dismissRecovery: useCallback(() => vm.dismissRecovery(), [vm]),
  }
}
