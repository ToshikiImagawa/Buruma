import type { ChatMessage, ConversationSummary } from '@domain'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

/**
 * チャット履歴・会話管理・ストリーミングバッチを担当する Service。
 *
 * ClaudeStateService に依存し、conversation の作成・切替・削除時に session 状態を連動させる。
 * 依存方向: ChatHistoryService → ClaudeStateService（逆方向の依存は禁止）。
 */
export interface ChatHistoryService extends BaseService {
  readonly chatMessages$: Observable<ChatMessage[]>
  readonly conversations$: Observable<ConversationSummary[]>
  readonly currentConversationId$: Observable<string | null>

  /**
   * メッセージを追加する。conversation が存在しない場合は新規作成（worktreePath を使用）。
   * 戻り値は conversationId（== sessionId）。
   */
  addChatMessage(message: ChatMessage, worktreePath: string): Promise<string>

  /** 非確定 assistant メッセージにストリーミング chunk を追記（requestAnimationFrame でバッチ flush）。 */
  appendToLastAssistantMessage(content: string, sessionId?: string): void

  /** ストリーミング中の保留 chunk を強制 flush し、永続化を発火する。 */
  finalizeLastAssistantMessage(sessionId?: string): void

  clearChatMessages(): void

  createConversation(worktreePath: string): Promise<string>
  resumeConversation(conversationId: string): Promise<void>
  switchConversation(id: string): void
  deleteConversation(id: string): void
  startNewConversation(): void

  getConversationWorktreePath(conversationId: string): string | null

  /** active conversation の id を同期取得する（DI 層のイベントハンドラから利用）。 */
  getCurrentConversationId(): string | null

  /** onSessionChanged 経由で受け取った claudeSessionId を会話の永続化対象に同期する。 */
  syncClaudeSessionId(conversationId: string, claudeSessionId: string | undefined): void

  /** 永続化ストアから会話一覧を復元する。setUp 後に 1 度だけ呼ぶ想定。 */
  loadConversations(): Promise<void>
}
