import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { BranchOpsViewModelToken } from '../di-tokens'

export function useBranchOpsViewModel() {
  const vm = useResolve(BranchOpsViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const lastError = useObservable(vm.lastError$, null)

  return {
    loading,
    lastError,
    createBranch: useCallback(
      (worktreePath: string, name: string, startPoint?: string) => vm.createBranch(worktreePath, name, startPoint),
      [vm],
    ),
    checkoutBranch: useCallback(
      (worktreePath: string, branch: string) => vm.checkoutBranch(worktreePath, branch),
      [vm],
    ),
    deleteBranch: useCallback(
      (worktreePath: string, branch: string, remote?: boolean, force?: boolean) =>
        vm.deleteBranch(worktreePath, branch, remote, force),
      [vm],
    ),
  }
}
