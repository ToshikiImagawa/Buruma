import type { ChatMessage, Conversation, ConversationSummary } from '@domain'
import type { Observable } from 'rxjs'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ChatHistoryService } from './chat-history-service-interface'
import type { ClaudeStateService } from './claude-state-service-interface'
import { BehaviorSubject } from 'rxjs'

const MAX_CONVERSATIONS = 100
const MAX_MESSAGES_PER_CONVERSATION = 500
const DEFAULT_CONVERSATION_TITLE = '新しい会話'

export class ChatHistoryDefaultService implements ChatHistoryService {
  private readonly _chatMessages$ = new BehaviorSubject<ChatMessage[]>([])
  private readonly _conversations$ = new BehaviorSubject<ConversationSummary[]>([])
  private readonly _currentConversationId$ = new BehaviorSubject<string | null>(null)
  private readonly conversationStore = new Map<string, Conversation>()
  private readonly pendingContentMap = new Map<string, string>()
  private flushScheduled = false

  readonly chatMessages$: Observable<ChatMessage[]>
  readonly conversations$: Observable<ConversationSummary[]>
  readonly currentConversationId$: Observable<string | null>

  constructor(
    private readonly repository: ClaudeRepository,
    private readonly stateService: ClaudeStateService,
  ) {
    this.chatMessages$ = this._chatMessages$.asObservable()
    this.conversations$ = this._conversations$.asObservable()
    this.currentConversationId$ = this._currentConversationId$.asObservable()
  }

  setUp(): void {
    // BaseService 契約のため
  }

  tearDown(): void {
    this._chatMessages$.complete()
    this._conversations$.complete()
    this._currentConversationId$.complete()
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
    this.persistConversations().catch((e) => console.error('[ChatHistoryService] persist failed:', e))
  }

  clearChatMessages(): void {
    this._chatMessages$.next([])
  }

  async createConversation(worktreePath: string): Promise<string> {
    if (this.conversationStore.size >= MAX_CONVERSATIONS) {
      const oldest = this.findOldestConversation()
      if (oldest) {
        this.conversationStore.delete(oldest.id)
        this.stateService.removeSession(oldest.id)
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
    this._currentConversationId$.next(id)
    this._chatMessages$.next([])
    this.stateService.registerSession(id, session)
    this.refreshConversationSummaries()
    this.persistConversations().catch((e) => console.error('[ChatHistoryService] persist failed:', e))
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
    this.stateService.switchActiveConversation(id)
  }

  deleteConversation(id: string): void {
    this.repository.stopSession(id).catch(() => {
      // エラーは IPC イベント経由で通知される
    })
    this.conversationStore.delete(id)
    this.pendingContentMap.delete(id)
    this.stateService.removeSession(id)
    if (this._currentConversationId$.getValue() === id) {
      this._currentConversationId$.next(null)
      this._chatMessages$.next([])
    }
    this.refreshConversationSummaries()
    this.persistConversations().catch((e) => console.error('[ChatHistoryService] persist failed:', e))
  }

  getConversationWorktreePath(conversationId: string): string | null {
    const conversation = this.conversationStore.get(conversationId)
    return conversation?.worktreePath ?? null
  }

  getCurrentConversationId(): string | null {
    return this._currentConversationId$.getValue()
  }

  startNewConversation(): void {
    this.saveCurrentConversationMessages()
    this._currentConversationId$.next(null)
    this._chatMessages$.next([])
    this.stateService.clearActiveConversation()
  }

  syncClaudeSessionId(conversationId: string, claudeSessionId: string | undefined): void {
    if (!claudeSessionId) return
    const conv = this.conversationStore.get(conversationId)
    if (conv) {
      conv.claudeSessionId = claudeSessionId
    }
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

  private async persistConversations(): Promise<void> {
    const conversations: Conversation[] = []
    for (const conv of this.conversationStore.values()) {
      const session = this.stateService.getSession(conv.id)
      conversations.push({
        ...conv,
        claudeSessionId: session?.claudeSessionId ?? conv.claudeSessionId,
      })
    }
    await this.repository.savePersistedConversations(conversations)
  }

  private async ensureSession(conversationId: string): Promise<void> {
    if (this.stateService.getSession(conversationId)) return
    const conversation = this.conversationStore.get(conversationId)
    if (!conversation) return
    const session = await this.repository.startSession(
      conversation.worktreePath,
      conversationId,
      conversation.claudeSessionId,
    )
    this.stateService.registerSession(conversationId, session)
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
