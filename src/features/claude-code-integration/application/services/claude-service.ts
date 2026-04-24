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
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from './claude-service-interface'
import { DEFAULT_MODEL } from '@domain'
import { BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

const MAX_OUTPUT_BUFFER = 1000
const MAX_CONVERSATIONS = 100
const MAX_MESSAGES_PER_CONVERSATION = 500
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
  private readonly sessionStore = new Map<string, ClaudeSession>()
  private readonly commandRunningMap = new Map<string, boolean>()
  private readonly pendingContentMap = new Map<string, string>()
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

  constructor(private readonly repository: ClaudeRepository) {
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
    // BaseService インターフェースの契約を満たすため
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
    if (session) {
      this.sessionStore.set(session.id, session)
      // claudeSessionId を会話データにも反映（永続化時に含めるため）
      if (session.claudeSessionId) {
        const conv = this.conversationStore.get(session.id)
        if (conv) {
          conv.claudeSessionId = session.claudeSessionId
        }
      }
      const isCurrentConversation = this._currentConversationId$.getValue() === session.id
      if (isCurrentConversation) {
        this._currentSession$.next(session)
        if (session.status === 'idle') {
          this.commandRunningMap.set(session.id, false)
          this._isCommandRunning$.next(false)
        }
      }
    } else {
      const currentId = this._currentConversationId$.getValue()
      if (currentId) {
        this.sessionStore.delete(currentId)
        this.commandRunningMap.delete(currentId)
      }
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

  async addChatMessage(message: ChatMessage, worktreePath: string): Promise<string> {
    let conversationId = this._currentConversationId$.getValue()
    if (!conversationId) {
      conversationId = await this.createConversation(worktreePath)
    } else {
      await this.ensureSession(conversationId)
    }

    const current = this._chatMessages$.getValue()
    const updated = [...current, message].slice(-MAX_MESSAGES_PER_CONVERSATION)
    this._chatMessages$.next(updated)

    const conversation = this.conversationStore.get(conversationId)
    if (conversation) {
      conversation.messages = updated
      conversation.updatedAt = new Date().toISOString()
      if (message.role === 'user' && conversation.title === DEFAULT_CONVERSATION_TITLE) {
        conversation.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
      }
      this.refreshConversationSummaries()
    }
    return conversationId
  }

  appendToLastAssistantMessage(content: string, sessionId?: string): void {
    const targetId = sessionId ?? this._currentConversationId$.getValue()
    if (!targetId) return
    const existing = this.pendingContentMap.get(targetId) ?? ''
    this.pendingContentMap.set(targetId, existing + content)
    if (!this.flushScheduled) {
      this.flushScheduled = true
      requestAnimationFrame(() => this.flushPendingContent())
    }
  }

  private flushPendingContent(): void {
    this.flushScheduled = false
    const entries = new Map(this.pendingContentMap)
    this.pendingContentMap.clear()

    for (const [convId, chunk] of entries) {
      if (!chunk) continue
      this.flushContentToConversation(convId, chunk)
    }
  }

  private flushContentToConversation(conversationId: string, chunk: string): void {
    const conversation = this.conversationStore.get(conversationId)
    if (!conversation) return

    const isCurrentConversation = this._currentConversationId$.getValue() === conversationId
    const messages = isCurrentConversation ? this._chatMessages$.getValue() : conversation.messages

    const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant')
    const lastUserIndex = messages.findLastIndex((m) => m.role === 'user')

    let updated: ChatMessage[]
    // assistant メッセージがないか、最後の user メッセージより前にある場合は新規作成
    if (lastAssistantIndex === -1 || lastUserIndex > lastAssistantIndex) {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: chunk,
        timestamp: new Date().toISOString(),
      }
      updated = [...messages, newMessage]
    } else {
      updated = [...messages]
      updated[lastAssistantIndex] = {
        ...updated[lastAssistantIndex],
        content: updated[lastAssistantIndex].content + chunk,
      }
    }

    if (isCurrentConversation) {
      this._chatMessages$.next(updated)
    }
    conversation.messages = updated
    conversation.updatedAt = new Date().toISOString()
  }

  finalizeLastAssistantMessage(sessionId?: string): void {
    const targetId = sessionId ?? this._currentConversationId$.getValue()
    if (targetId) {
      const pending = this.pendingContentMap.get(targetId)
      if (pending) {
        this.pendingContentMap.delete(targetId)
        this.flushContentToConversation(targetId, pending)
      }
    }
    this.refreshConversationSummaries()
    this.persistConversations().catch((e) => console.error('[ClaudeService] persist failed:', e))
  }

  clearChatMessages(): void {
    this._chatMessages$.next([])
  }

  setCommandRunning(running: boolean, sessionId?: string): void {
    const targetId = sessionId ?? this._currentConversationId$.getValue()
    if (targetId) {
      this.commandRunningMap.set(targetId, running)
    }
    if (!targetId || targetId === this._currentConversationId$.getValue()) {
      this._isCommandRunning$.next(running)
    }
  }

  getSelectedModel(): string {
    return this._selectedModel$.getValue()
  }

  setSelectedModel(model: string): void {
    this._selectedModel$.next(model)
  }

  async createConversation(worktreePath: string): Promise<string> {
    // 上限チェック: 最古の会話を自動削除
    if (this.conversationStore.size >= MAX_CONVERSATIONS) {
      const oldest = this.findOldestConversation()
      if (oldest) {
        this.conversationStore.delete(oldest.id)
        this.sessionStore.delete(oldest.id)
        this.commandRunningMap.delete(oldest.id)
      }
    }
    const session = await this.repository.startSession(worktreePath)
    const id = session.id
    const now = new Date().toISOString()
    const conversation: Conversation = {
      id,
      worktreePath,
      title: DEFAULT_CONVERSATION_TITLE,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    this.conversationStore.set(id, conversation)
    this.sessionStore.set(id, session)
    this._currentConversationId$.next(id)
    this._currentSession$.next(session)
    this._isCommandRunning$.next(false)
    this._chatMessages$.next([])
    this.refreshConversationSummaries()
    this.persistConversations().catch((e) => console.error('[ClaudeService] persist failed:', e))
    return id
  }

  async resumeConversation(conversationId: string): Promise<void> {
    await this.ensureSession(conversationId)
  }

  switchConversation(id: string): void {
    this.saveCurrentConversationMessages()

    const conversation = this.conversationStore.get(id)
    if (!conversation) return
    this._currentConversationId$.next(id)
    this._chatMessages$.next([...conversation.messages])
    this._currentSession$.next(this.sessionStore.get(id) ?? null)
    this._isCommandRunning$.next(this.commandRunningMap.get(id) ?? false)
  }

  deleteConversation(id: string): void {
    this.repository.stopSession(id).catch(() => {
      // エラーは IPC イベント経由で通知される
    })
    this.conversationStore.delete(id)
    this.sessionStore.delete(id)
    this.commandRunningMap.delete(id)
    if (this._currentConversationId$.getValue() === id) {
      this._currentConversationId$.next(null)
      this._chatMessages$.next([])
      this._currentSession$.next(null)
      this._isCommandRunning$.next(false)
    }
    this.refreshConversationSummaries()
    this.persistConversations().catch((e) => console.error('[ClaudeService] persist failed:', e))
  }

  getConversationWorktreePath(conversationId: string): string | null {
    const conversation = this.conversationStore.get(conversationId)
    return conversation?.worktreePath ?? null
  }

  startNewConversation(): void {
    this.saveCurrentConversationMessages()
    this._currentConversationId$.next(null)
    this._chatMessages$.next([])
    this._currentSession$.next(null)
    this._isCommandRunning$.next(false)
  }

  private saveCurrentConversationMessages(): void {
    const currentId = this._currentConversationId$.getValue()
    if (!currentId) return
    const conversation = this.conversationStore.get(currentId)
    if (!conversation) return
    conversation.messages = this._chatMessages$.getValue()
    conversation.updatedAt = new Date().toISOString()
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
    summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    this._conversations$.next(summaries)
  }

  async loadConversations(): Promise<void> {
    const persisted = await this.repository.getPersistedConversations()
    for (const conv of persisted) {
      this.conversationStore.set(conv.id, conv)
    }
    this.refreshConversationSummaries()
  }

  async persistConversations(): Promise<void> {
    const conversations: Conversation[] = []
    for (const conv of this.conversationStore.values()) {
      const session = this.sessionStore.get(conv.id)
      conversations.push({
        ...conv,
        claudeSessionId: session?.claudeSessionId ?? conv.claudeSessionId,
      })
    }
    await this.repository.savePersistedConversations(conversations)
  }

  private async ensureSession(conversationId: string): Promise<void> {
    if (this.sessionStore.has(conversationId)) return
    const conversation = this.conversationStore.get(conversationId)
    if (!conversation) return
    const session = await this.repository.startSession(
      conversation.worktreePath,
      conversationId,
      conversation.claudeSessionId,
    )
    this.sessionStore.set(conversationId, session)
    this._currentSession$.next(session)
  }

  private findOldestConversation(): Conversation | undefined {
    let oldest: Conversation | undefined
    for (const conv of this.conversationStore.values()) {
      if (!oldest || conv.updatedAt < oldest.updatedAt) {
        oldest = conv
      }
    }
    return oldest
  }
}
