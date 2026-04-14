import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { CommitViewModelToken } from '../di-tokens'

export function useCommitViewModel() {
  const vm = useResolve(CommitViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const generating = useObservable(vm.generating$, false)
  const generateError = useObservable(vm.generateError$, null)
  const lastCommitResult = useObservable(vm.lastCommitResult$, null)

  return {
    loading,
    generating,
    generateError,
    lastCommitResult,
    commit: useCallback(
      (worktreePath: string, message: string, amend?: boolean) => vm.commit(worktreePath, message, amend),
      [vm],
    ),
    generateCommitMessage: useCallback((worktreePath: string) => vm.generateCommitMessage(worktreePath), [vm]),
  }
}
