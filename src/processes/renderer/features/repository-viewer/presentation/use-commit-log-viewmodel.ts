import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { CommitLogViewModelToken } from '../di-tokens'

export function useCommitLogViewModel() {
  const vm = useResolve(CommitLogViewModelToken)
  const commits = useObservable(vm.commits$, [])
  const hasMore = useObservable(vm.hasMore$, false)
  const loading = useObservable(vm.loading$, false)
  const selectedCommit = useObservable(vm.selectedCommit$, null)

  return {
    commits,
    hasMore,
    loading,
    selectedCommit,
    loadCommits: useCallback((worktreePath: string) => vm.loadCommits(worktreePath), [vm]),
    loadMore: useCallback((worktreePath: string) => vm.loadMore(worktreePath), [vm]),
    selectCommit: useCallback((worktreePath: string, hash: string) => vm.selectCommit(worktreePath, hash), [vm]),
    setSearch: useCallback((search: string) => vm.setSearch(search), [vm]),
  }
}
