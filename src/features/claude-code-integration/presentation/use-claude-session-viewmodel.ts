import { useCallback } from 'react'
import { DEFAULT_MODEL } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { ClaudeSessionViewModelToken } from '../di-tokens'

export function useClaudeSessionViewModel() {
  const vm = useResolve(ClaudeSessionViewModelToken)
  const status = useObservable(vm.status$, 'idle')
  const outputs = useObservable(vm.outputs$, [])
  const chatMessages = useObservable(vm.chatMessages$, [])
  const isSessionActive = useObservable(vm.isSessionActive$, false)
  const isCommandRunning = useObservable(vm.isCommandRunning$, false)
  const conversations = useObservable(vm.conversations$, [])
  const currentConversationId = useObservable(vm.currentConversationId$, null)
  const selectedModel = useObservable(vm.selectedModel$, DEFAULT_MODEL)

  return {
    status,
    outputs,
    chatMessages,
    isSessionActive,
    isCommandRunning,
    conversations,
    currentConversationId,
    selectedModel,
    startSession: useCallback((worktreePath: string) => vm.startSession(worktreePath), [vm]),
    resumeSession: useCallback((id: string) => vm.resumeSession(id), [vm]),
    stopSession: useCallback((sessionId: string) => vm.stopSession(sessionId), [vm]),
    sendCommand: useCallback((worktreePath: string, input: string) => vm.sendCommand(worktreePath, input), [vm]),
    switchConversation: useCallback((id: string) => vm.switchConversation(id), [vm]),
    deleteConversation: useCallback((id: string) => vm.deleteConversation(id), [vm]),
    startNewConversation: useCallback(() => vm.startNewConversation(), [vm]),
    setSelectedModel: useCallback((model: string) => vm.setSelectedModel(model), [vm]),
  }
}
