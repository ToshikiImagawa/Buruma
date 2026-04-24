import type {
  ChatMessage,
  ClaudeOutput,
  ConflictResolveResult,
  ConflictResolvingProgress,
  ConversationSummary,
  DiffTarget,
  ReviewComment,
  SessionStatus,
  ThreeWayContent,
} from '@domain'
import type { Observable } from 'rxjs'

export interface ClaudeSessionViewModel {
  readonly status$: Observable<SessionStatus>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly chatMessages$: Observable<ChatMessage[]>
  readonly isSessionActive$: Observable<boolean>
  readonly isCommandRunning$: Observable<boolean>
  readonly conversations$: Observable<ConversationSummary[]>
  readonly currentConversationId$: Observable<string | null>
  readonly selectedModel$: Observable<string>
  setSelectedModel(model: string): void
  startSession(worktreePath: string): void
  resumeSession(conversationId: string): void
  stopSession(sessionId: string): void
  sendCommand(worktreePath: string, input: string): void
  switchConversation(id: string): void
  deleteConversation(id: string): void
  startNewConversation(): void
}

export interface ClaudeReviewViewModel {
  readonly reviewComments$: Observable<ReviewComment[]>
  readonly reviewSummary$: Observable<string>
  readonly isReviewing$: Observable<boolean>
  requestReview(worktreePath: string, diffTarget: DiffTarget, diffText: string): void
}

export interface ClaudeExplainViewModel {
  readonly explanation$: Observable<string>
  readonly isExplaining$: Observable<boolean>
  requestExplain(worktreePath: string, diffTarget: DiffTarget, diffText: string): void
}

export interface ClaudeConflictViewModel {
  readonly isResolvingConflict$: Observable<boolean>
  readonly conflictResult$: Observable<ConflictResolveResult | null>
  readonly resolvingProgress$: Observable<ConflictResolvingProgress | null>
  resolveConflict(worktreePath: string, filePath: string, threeWayContent: ThreeWayContent): void
  resolveAll(worktreePath: string, files: Array<{ filePath: string; threeWayContent: ThreeWayContent }>): void
}
