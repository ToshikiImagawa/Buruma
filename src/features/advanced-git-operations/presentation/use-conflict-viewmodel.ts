import { useCallback } from 'react'
import type { ConflictResolveAllOptions, ConflictResolveOptions } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { ConflictViewModelToken } from '../di-tokens'

export function useConflictViewModel() {
  const vm = useResolve(ConflictViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const conflictFiles = useObservable(vm.conflictFiles$, [])
  const threeWayContent = useObservable(vm.threeWayContent$, null)

  return {
    loading,
    conflictFiles,
    threeWayContent,
    conflictList: useCallback((worktreePath: string) => vm.conflictList(worktreePath), [vm]),
    conflictFileContent: useCallback(
      (worktreePath: string, filePath: string) => vm.conflictFileContent(worktreePath, filePath),
      [vm],
    ),
    conflictResolve: useCallback((options: ConflictResolveOptions) => vm.conflictResolve(options), [vm]),
    conflictResolveAll: useCallback((options: ConflictResolveAllOptions) => vm.conflictResolveAll(options), [vm]),
    conflictMarkResolved: useCallback(
      (worktreePath: string, filePath: string) => vm.conflictMarkResolved(worktreePath, filePath),
      [vm],
    ),
  }
}
