import { useCallback } from 'react'
import type { ThreeWayContent } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { ClaudeConflictViewModelToken } from '../di-tokens'

export function useClaudeConflictViewModel() {
  const vm = useResolve(ClaudeConflictViewModelToken)
  const isResolvingConflict = useObservable(vm.isResolvingConflict$, false)
  const conflictResult = useObservable(vm.conflictResult$, null)
  const resolvingProgress = useObservable(vm.resolvingProgress$, null)

  return {
    isResolvingConflict,
    conflictResult,
    resolvingProgress,
    resolveConflict: useCallback(
      (worktreePath: string, filePath: string, threeWayContent: ThreeWayContent) =>
        vm.resolveConflict(worktreePath, filePath, threeWayContent),
      [vm],
    ),
    resolveAll: useCallback(
      (worktreePath: string, files: Array<{ filePath: string; threeWayContent: ThreeWayContent }>) =>
        vm.resolveAll(worktreePath, files),
      [vm],
    ),
  }
}
