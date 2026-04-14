import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { ClaudeSessionViewModelToken } from '../di-tokens'

export function useClaudeSessionViewModel() {
  const vm = useResolve(ClaudeSessionViewModelToken)
  const status = useObservable(vm.status$, 'idle')
  const outputs = useObservable(vm.outputs$, [])
  const isSessionActive = useObservable(vm.isSessionActive$, false)

  return {
    status,
    outputs,
    isSessionActive,
    startSession: useCallback((worktreePath: string) => vm.startSession(worktreePath), [vm]),
    stopSession: useCallback((worktreePath: string) => vm.stopSession(worktreePath), [vm]),
    sendCommand: useCallback((worktreePath: string, input: string) => vm.sendCommand(worktreePath, input), [vm]),
  }
}
