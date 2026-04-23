import type {
  ChatMessage,
  ClaudeAuthStatus,
  ClaudeOutput,
  ClaudeSession,
  ConflictResolveResult,
  ConflictResolvingProgress,
  Conversation,
  ConversationSummary,
  ExplainResult,
  ReviewComment,
  ReviewResult,
  SessionStatus,
} from '@domain'
import type { Observable } from 'rxjs'
import type { ClaudeService } from './claude-service-interface'
import { DEFAULT_MODEL } from '@domain'
import { BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

const MAX_OUTPUT_BUFFER = 1000
const DEFAULT_CONVERSATION_TITLE = '新しい会話'

export class ClaudeDefaultService implements ClaudeService {
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
  private readonly _chatMessages$ = new BehaviorSubject<ChatMessage[]>([])
  private readonly _isCommandRunning$ = new BehaviorSubject<boolean>(false)
  private readonly _conversations$ = new BehaviorSubject<ConversationSummary[]>([])
  private readonly _currentConversationId$ = new BehaviorSubject<string | null>(null)
  private readonly _selectedModel$ = new BehaviorSubject<string>(DEFAULT_MODEL)
  private readonly conversationStore = new Map<string, Conversation>()
  private pendingContent = ''
  private flushScheduled = false

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
    this.chatMessages$ = this._chatMessages$.asObservable()
    this.isCommandRunning$ = this._isCommandRunning$.asObservable()
    this.conversations$ = this._conversations$.asObservable()
    this.currentConversationId$ = this._currentConversationId$.asObservable()
    this.selectedModel$ = this._selectedModel$.asObservable()
  }

  setUp(): void {
    // Initial state already set by BehaviorSubject defaults
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
    this._chatMessages$.complete()
    this._isCommandRunning$.complete()
    this._conversations$.complete()
    this._currentConversationId$.complete()
    this._selectedModel$.complete()
  }

  updateSession(session: ClaudeSession | null): void {
    this._currentSession$.next(session)
    if (!session || session.status === 'idle') {
      this._outputs$.next([])
      this.clearChatMessages()
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

  addChatMessage(message: ChatMessage): void {
    let conversationId = this._currentConversationId$.getValue()
    if (!conversationId) {
      conversationId = this.createConversation()
    }

    const current = this._chatMessages$.getValue()
    this._chatMessages$.next([...current, message])

    const conversation = this.conversationStore.get(conversationId)
    if (conversation) {
      conversation.messages = [...current, message]
      conversation.updatedAt = new Date().toISOString()
      if (message.role === 'user' && conversation.title === DEFAULT_CONVERSATION_TITLE) {
        conversation.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
      }
      this.refreshConversationSummaries()
    }
  }

  appendToLastAssistantMessage(content: string): void {
    this.pendingContent += content
    if (!this.flushScheduled) {
      this.flushScheduled = true
      requestAnimationFrame(() => this.flushPendingContent())
    }
  }

  private flushPendingContent(): void {
    this.flushScheduled = false
    const chunk = this.pendingContent
    this.pendingContent = ''
    if (!chunk) return

    const current = this._chatMessages$.getValue()
    const lastAssistantIndex = current.findLastIndex((m) => m.role === 'assistant')
    const lastUserIndex = current.findLastIndex((m) => m.role === 'user')
    // assistant メッセージがないか、最後の user メッセージより前にある場合は新規作成
    if (lastAssistantIndex === -1 || lastUserIndex > lastAssistantIndex) {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: chunk,
        timestamp: new Date().toISOString(),
      }
      const updated = [...current, newMessage]
      this._chatMessages$.next(updated)
      this.syncMessagesToConversation(updated)
      return
    }
    const updated = [...current]
    updated[lastAssistantIndex] = {
      ...updated[lastAssistantIndex],
      content: updated[lastAssistantIndex].content + chunk,
    }
    this._chatMessages$.next(updated)
    this.syncMessagesToConversation(updated)
  }

  finalizeLastAssistantMessage(): void {
    this.flushPendingContent()
    this.syncConversationSummaries()
  }

  clearChatMessages(): void {
    this._chatMessages$.next([])
  }

  setCommandRunning(running: boolean): void {
    this._isCommandRunning$.next(running)
  }

  getSelectedModel(): string {
    return this._selectedModel$.getValue()
  }

  setSelectedModel(model: string): void {
    this._selectedModel$.next(model)
  }

  createConversation(): string {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const conversation: Conversation = {
      id,
      title: DEFAULT_CONVERSATION_TITLE,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    this.conversationStore.set(id, conversation)
    this._currentConversationId$.next(id)
    this._chatMessages$.next([])
    this.refreshConversationSummaries()
    return id
  }

  switchConversation(id: string): void {
    this.saveCurrentConversationMessages()

    const conversation = this.conversationStore.get(id)
    if (!conversation) return
    this._currentConversationId$.next(id)
    this._chatMessages$.next([...conversation.messages])
  }

  deleteConversation(id: string): void {
    this.conversationStore.delete(id)
    if (this._currentConversationId$.getValue() === id) {
      this._currentConversationId$.next(null)
      this._chatMessages$.next([])
    }
    this.refreshConversationSummaries()
  }

  startNewConversation(): void {
    this.saveCurrentConversationMessages()
    this._currentConversationId$.next(null)
    this._chatMessages$.next([])
  }

  private saveCurrentConversationMessages(): void {
    const currentId = this._currentConversationId$.getValue()
    if (!currentId) return
    const conversation = this.conversationStore.get(currentId)
    if (!conversation) return
    conversation.messages = this._chatMessages$.getValue()
    conversation.updatedAt = new Date().toISOString()
  }

  private syncMessagesToConversation(messages: ChatMessage[]): void {
    const currentId = this._currentConversationId$.getValue()
    if (!currentId) return
    const conversation = this.conversationStore.get(currentId)
    if (!conversation) return
    conversation.messages = messages
    conversation.updatedAt = new Date().toISOString()
  }

  private syncConversationSummaries(): void {
    this.refreshConversationSummaries()
  }

  private refreshConversationSummaries(): void {
    const summaries: ConversationSummary[] = []
    for (const conv of this.conversationStore.values()) {
      const lastMessage = conv.messages[conv.messages.length - 1]
      summaries.push({
        id: conv.id,
        title: conv.title,
        lastMessagePreview: lastMessage ? lastMessage.content.slice(0, 100) : '',
        messageCount: conv.messages.length,
        updatedAt: conv.updatedAt,
      })
    }
    // 最新の会話を先頭にソート
    summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    this._conversations$.next(summaries)
  }
}
