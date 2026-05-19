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
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

/**
 * セッション・出力・コマンド実行状態など、チャット履歴以外の Claude 連携状態を保持する Service。
 *
 * - 純粋な状態保持に専念し、他の Service への依存を持たない（依存方向: ChatHistoryService → ClaudeStateService）。
 * - sessionStore / commandRunningMap は会話単位（conversationId === session.id）でキーされる。
 */
export interface ClaudeStateService extends BaseService {
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

  /** sessionStore に保持されている session を取得する（ChatHistoryService の switchConversation 用）。 */
  getSession(conversationId: string): ClaudeSession | null

  /** 新規 conversation のために session を登録し、active conversation として設定する。 */
  registerSession(conversationId: string, session: ClaudeSession): void

  /** active conversation を別の conversation に切り替える（既存 sessionStore から取得）。 */
  switchActiveConversation(conversationId: string): void

  /** active conversation を未選択（null）に戻す。chatMessages / currentSession / isCommandRunning をリセット。 */
  clearActiveConversation(): void

  /** 指定 conversation の session 情報を撤去する。current だった場合は active も解除。 */
  removeSession(conversationId: string): void

  /**
   * onSessionChanged イベントから受け取った session を反映する。
   * session が active conversation 宛の場合は currentSession$ を更新し、status === 'idle' なら isCommandRunning を解除。
   * session が null の場合は active conversation の session を撤去する。
   */
  handleSessionEvent(session: ClaudeSession | null, activeConversationId: string | null): void

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

  getSelectedModel(): string
  setSelectedModel(model: string): void

  /**
   * command 実行中フラグを per-session で記録する。sessionId 省略時は active conversation を対象。
   * active conversation のみ isCommandRunning$ に反映される。
   */
  setCommandRunning(running: boolean, sessionId?: string, activeConversationId?: string | null): void
}
