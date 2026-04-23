import type {
  ChatMessage,
  ClaudeAuthStatus,
  ClaudeOutput,
  ClaudeSession,
  ConflictResolveResult,
  ConflictResolvingProgress,
  ConversationSummary,
  ExplainResult,
  ReviewComment,
  ReviewResult,
  SessionStatus,
} from '@domain'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

export interface ClaudeService extends BaseService {
  readonly currentSession$: Observable<ClaudeSession | null>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly status$: Observable<SessionStatus>
  readonly authStatus$: Observable<ClaudeAuthStatus | null>
  readonly isAuthChecking$: Observable<boolean>
  readonly isLoggingIn$: Observable<boolean>
  readonly reviewComments$: Observable<ReviewComment[]>
  readonly reviewSummary$: Observable<string>
  readonly isReviewing$: Observable<boolean>
  readonly explanation$: Observable<string>
  readonly isExplaining$: Observable<boolean>
  readonly isResolvingConflict$: Observable<boolean>
  readonly conflictResult$: Observable<ConflictResolveResult | null>
  readonly resolvingProgress$: Observable<ConflictResolvingProgress | null>
  readonly chatMessages$: Observable<ChatMessage[]>
  readonly isCommandRunning$: Observable<boolean>
  readonly conversations$: Observable<ConversationSummary[]>
  readonly currentConversationId$: Observable<string | null>
  readonly selectedModel$: Observable<string>
  getSelectedModel(): string
  setSelectedModel(model: string): void
  addChatMessage(message: ChatMessage): void
  appendToLastAssistantMessage(content: string): void
  finalizeLastAssistantMessage(): void
  clearChatMessages(): void
  setCommandRunning(running: boolean): void
  createConversation(): string
  switchConversation(id: string): void
  deleteConversation(id: string): void
  startNewConversation(): void
  updateSession(session: ClaudeSession | null): void
  appendOutput(output: ClaudeOutput): void
  clearOutputs(): void
  setAuthStatus(status: ClaudeAuthStatus | null): void
  setAuthChecking(checking: boolean): void
  setLoggingIn(loggingIn: boolean): void
  setReviewResult(result: ReviewResult): void
  setReviewing(reviewing: boolean): void
  setExplainResult(result: ExplainResult): void
  setExplaining(explaining: boolean): void
  setResolvingConflict(resolving: boolean): void
  setConflictResult(result: ConflictResolveResult | null): void
  setResolvingProgress(progress: ConflictResolvingProgress | null): void
}
