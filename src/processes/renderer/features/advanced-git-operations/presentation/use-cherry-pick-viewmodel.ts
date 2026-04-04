import { useCallback } from 'react'
import type { CherryPickOptions } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { CherryPickViewModelToken } from '../di-tokens'

export function useCherryPickViewModel() {
  const vm = useResolve(CherryPickViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const cherryPickResult = useObservable(vm.cherryPickResult$, null)

  return {
    loading,
    cherryPickResult,
    cherryPick: useCallback((options: CherryPickOptions) => vm.cherryPick(options), [vm]),
    cherryPickAbort: useCallback(
      (worktreePath: string) => vm.cherryPickAbort(worktreePath),
      [vm],
    ),
  }
}
