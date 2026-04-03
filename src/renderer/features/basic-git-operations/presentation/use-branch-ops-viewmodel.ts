import { useCallback } from 'react'
import { useResolve } from '@shared/lib/di/v-container-provider'
import { useObservable } from '@shared/lib/hooks/use-observable'
import { BranchOpsViewModelToken } from '../di-tokens'

export function useBranchOpsViewModel() {
  const vm = useResolve(BranchOpsViewModelToken)
  const loading = useObservable(vm.loading$, false)

  return {
    loading,
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
