import { useCallback } from 'react'
import type { DiffTarget } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { ClaudeExplainViewModelToken } from '../di-tokens'

export function useClaudeExplainViewModel() {
  const vm = useResolve(ClaudeExplainViewModelToken)
  const explanation = useObservable(vm.explanation$, '')
  const isExplaining = useObservable(vm.isExplaining$, false)

  return {
    explanation,
    isExplaining,
    requestExplain: useCallback(
      (worktreePath: string, diffTarget: DiffTarget, diffText: string) =>
        vm.requestExplain(worktreePath, diffTarget, diffText),
      [vm],
    ),
  }
}
