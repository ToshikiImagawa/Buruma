import type {
  ClaudeAuthStatus,
  ClaudeOutput,
  ClaudeSession,
  ConflictResolveResult,
  ConflictResolvingProgress,
  ExplainResult,
  ReviewComment,
  ReviewResult,
  SessionStatus,
} from '@domain'
import type { Observable } from 'rxjs'
import type { ClaudeStateService } from './claude-state-service-interface'
import { DEFAULT_MODEL } from '@domain'
import { BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

const MAX_OUTPUT_BUFFER = 1000

export class ClaudeStateDefaultService implements ClaudeStateService {
  private readonly _currentSession$ = new BehaviorSubject<ClaudeSession | null>(null)
  private readonly _outputs$ = new BehaviorSubject<ClaudeOutput[]>([])
  private readonly _authStatus$ = new BehaviorSubject<ClaudeAuthStatus | null>(null)
  private readonly _isAuthChecking$ = new BehaviorSubject<boolean>(false)
  private readonly _isLoggingIn$ = new BehaviorSubject<boolean>(false)
  private readonly _reviewComments$ = new BehaviorSubject<ReviewComment[]>([])
  private readonly _reviewSummary$ = new BehaviorSubject<string>('')
  private readonly _isReviewing$ = new BehaviorSubject<boolean>(false)
  private readonly _explanation$ = new BehaviorSubject<string>('')
  private readonly _isExplaining$ = new BehaviorSubject<boolean>(false)
  private readonly _isResolvingConflict$ = new BehaviorSubject<boolean>(false)
  private readonly _conflictResult$ = new BehaviorSubject<ConflictResolveResult | null>(null)
  private readonly _resolvingProgress$ = new BehaviorSubject<ConflictResolvingProgress | null>(null)
  private readonly _isCommandRunning$ = new BehaviorSubject<boolean>(false)
  private readonly _selectedModel$ = new BehaviorSubject<string>(DEFAULT_MODEL)
  private readonly sessionStore = new Map<string, ClaudeSession>()
  private readonly commandRunningMap = new Map<string, boolean>()
  private activeConversationId: string | null = null

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
  readonly isCommandRunning$: Observable<boolean>
  readonly selectedModel$: Observable<string>

  constructor() {
    this.currentSession$ = this._currentSession$.asObservable()
    this.outputs$ = this._outputs$.asObservable()
    this.status$ = this._currentSession$.pipe(map((s) => s?.status ?? 'idle'))
    this.authStatus$ = this._authStatus$.asObservable()
    this.isAuthChecking$ = this._isAuthChecking$.asObservable()
    this.isLoggingIn$ = this._isLoggingIn$.asObservable()
    this.reviewComments$ = this._reviewComments$.asObservable()
    this.reviewSummary$ = this._reviewSummary$.asObservable()
    this.isReviewing$ = this._isReviewing$.asObservable()
    this.explanation$ = this._explanation$.asObservable()
    this.isExplaining$ = this._isExplaining$.asObservable()
    this.isResolvingConflict$ = this._isResolvingConflict$.asObservable()
    this.conflictResult$ = this._conflictResult$.asObservable()
    this.resolvingProgress$ = this._resolvingProgress$.asObservable()
    this.isCommandRunning$ = this._isCommandRunning$.asObservable()
    this.selectedModel$ = this._selectedModel$.asObservable()
  }

  setUp(): void {
    // BaseService 契約のため
  }

  tearDown(): void {
    this._currentSession$.complete()
    this._outputs$.complete()
    this._authStatus$.complete()
    this._isAuthChecking$.complete()
    this._isLoggingIn$.complete()
    this._reviewComments$.complete()
    this._reviewSummary$.complete()
    this._isReviewing$.complete()
    this._explanation$.complete()
    this._isExplaining$.complete()
    this._isResolvingConflict$.complete()
    this._conflictResult$.complete()
    this._resolvingProgress$.complete()
    this._isCommandRunning$.complete()
    this._selectedModel$.complete()
  }

  getSession(conversationId: string): ClaudeSession | null {
    return this.sessionStore.get(conversationId) ?? null
  }

  registerSession(conversationId: string, session: ClaudeSession): void {
    this.sessionStore.set(conversationId, session)
    this.activeConversationId = conversationId
    this._currentSession$.next(session)
    this.commandRunningMap.set(conversationId, false)
    this._isCommandRunning$.next(false)
  }

  switchActiveConversation(conversationId: string): void {
    this.activeConversationId = conversationId
    this._currentSession$.next(this.sessionStore.get(conversationId) ?? null)
    this._isCommandRunning$.next(this.commandRunningMap.get(conversationId) ?? false)
  }

  clearActiveConversation(): void {
    this.activeConversationId = null
    this._currentSession$.next(null)
    this._isCommandRunning$.next(false)
  }

  removeSession(conversationId: string): void {
    this.sessionStore.delete(conversationId)
    this.commandRunningMap.delete(conversationId)
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null
      this._currentSession$.next(null)
      this._isCommandRunning$.next(false)
    }
  }

  handleSessionEvent(session: ClaudeSession | null, activeConversationId: string | null): void {
    if (session) {
      this.sessionStore.set(session.id, session)
      if (activeConversationId === session.id) {
        this._currentSession$.next(session)
        if (session.status === 'idle') {
          this.commandRunningMap.set(session.id, false)
          this._isCommandRunning$.next(false)
        }
      }
    } else if (activeConversationId) {
      this.sessionStore.delete(activeConversationId)
      this.commandRunningMap.delete(activeConversationId)
      this._currentSession$.next(null)
      this._isCommandRunning$.next(false)
    } else {
      this._currentSession$.next(null)
      this._isCommandRunning$.next(false)
    }
  }

  appendOutput(output: ClaudeOutput): void {
    const current = this._outputs$.getValue()
    const updated = [...current, output].slice(-MAX_OUTPUT_BUFFER)
    this._outputs$.next(updated)
  }

  clearOutputs(): void {
    this._outputs$.next([])
  }

  setAuthStatus(status: ClaudeAuthStatus | null): void {
    this._authStatus$.next(status)
  }

  setAuthChecking(checking: boolean): void {
    this._isAuthChecking$.next(checking)
  }

  setLoggingIn(loggingIn: boolean): void {
    this._isLoggingIn$.next(loggingIn)
  }

  setReviewResult(result: ReviewResult): void {
    this._reviewComments$.next(result.comments)
    this._reviewSummary$.next(result.summary)
  }

  setReviewing(reviewing: boolean): void {
    this._isReviewing$.next(reviewing)
  }

  setExplainResult(result: ExplainResult): void {
    this._explanation$.next(result.explanation)
  }

  setExplaining(explaining: boolean): void {
    this._isExplaining$.next(explaining)
  }

  setResolvingConflict(resolving: boolean): void {
    this._isResolvingConflict$.next(resolving)
  }

  setConflictResult(result: ConflictResolveResult | null): void {
    this._conflictResult$.next(result)
  }

  setResolvingProgress(progress: ConflictResolvingProgress | null): void {
    this._resolvingProgress$.next(progress)
  }

  getSelectedModel(): string {
    return this._selectedModel$.getValue()
  }

  setSelectedModel(model: string): void {
    this._selectedModel$.next(model)
  }

  setCommandRunning(running: boolean, sessionId?: string, activeConversationId?: string | null): void {
    const targetId = sessionId ?? activeConversationId ?? this.activeConversationId
    if (targetId) {
      this.commandRunningMap.set(targetId, running)
    }
    const active = activeConversationId ?? this.activeConversationId
    if (!targetId || targetId === active) {
      this._isCommandRunning$.next(running)
    }
  }
}
