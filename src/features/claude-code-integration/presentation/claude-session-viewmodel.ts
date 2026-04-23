import type { ChatMessage, ClaudeOutput, ConversationSummary, SessionStatus } from '@domain'
import type { Observable } from 'rxjs'
import type { ClaudeService } from '../application/services/claude-service-interface'
import type {
  GetChatMessagesRendererUseCase,
  GetConversationsRendererUseCase,
  GetCurrentConversationIdRendererUseCase,
  GetIsCommandRunningRendererUseCase,
  GetOutputsRendererUseCase,
  GetSessionStatusRendererUseCase,
  SendCommandRendererUseCase,
  StartSessionRendererUseCase,
  StopSessionRendererUseCase,
} from '../di-tokens'
import type { ClaudeSessionViewModel } from './viewmodel-interfaces'
import { map } from 'rxjs/operators'

export class ClaudeSessionDefaultViewModel implements ClaudeSessionViewModel {
  readonly status$: Observable<SessionStatus>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly chatMessages$: Observable<ChatMessage[]>
  readonly isSessionActive$: Observable<boolean>
  readonly isCommandRunning$: Observable<boolean>
  readonly conversations$: Observable<ConversationSummary[]>
  readonly currentConversationId$: Observable<string | null>
  readonly selectedModel$: Observable<string>

  constructor(
    private readonly startSessionUseCase: StartSessionRendererUseCase,
    private readonly stopSessionUseCase: StopSessionRendererUseCase,
    private readonly sendCommandUseCase: SendCommandRendererUseCase,
    getStatusUseCase: GetSessionStatusRendererUseCase,
    getOutputsUseCase: GetOutputsRendererUseCase,
    getChatMessagesUseCase: GetChatMessagesRendererUseCase,
    getIsCommandRunningUseCase: GetIsCommandRunningRendererUseCase,
    getConversationsUseCase: GetConversationsRendererUseCase,
    getCurrentConversationIdUseCase: GetCurrentConversationIdRendererUseCase,
    private readonly service: ClaudeService,
  ) {
    this.status$ = getStatusUseCase.store
    this.outputs$ = getOutputsUseCase.store
    this.chatMessages$ = getChatMessagesUseCase.store
    this.isSessionActive$ = this.status$.pipe(map((s) => s === 'running' || s === 'starting'))
    this.isCommandRunning$ = getIsCommandRunningUseCase.store
    this.conversations$ = getConversationsUseCase.store
    this.currentConversationId$ = getCurrentConversationIdUseCase.store
    this.selectedModel$ = service.selectedModel$
  }

  startSession(worktreePath: string): void {
    this.startSessionUseCase.invoke(worktreePath)
  }

  stopSession(worktreePath: string): void {
    this.stopSessionUseCase.invoke(worktreePath)
  }

  sendCommand(worktreePath: string, input: string): void {
    this.sendCommandUseCase.invoke({ worktreePath, type: 'general', input })
  }

  switchConversation(id: string): void {
    this.service.switchConversation(id)
  }

  deleteConversation(id: string): void {
    this.service.deleteConversation(id)
  }

  startNewConversation(): void {
    this.service.startNewConversation()
  }

  setSelectedModel(model: string): void {
    this.service.setSelectedModel(model)
  }
}
