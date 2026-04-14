import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { BranchListViewModelToken } from '../di-tokens'

export function useBranchListViewModel() {
  const vm = useResolve(BranchListViewModelToken)
  const branches = useObservable(vm.branches$, null)
  const loading = useObservable(vm.loading$, false)
  const search = useObservable(vm.search$, '')

  return {
    branches,
    loading,
    search,
    loadBranches: useCallback((worktreePath: string) => vm.loadBranches(worktreePath), [vm]),
    setSearch: useCallback((s: string) => vm.setSearch(s), [vm]),
  }
}
