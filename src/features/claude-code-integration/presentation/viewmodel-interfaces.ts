import type { ClaudeOutput, DiffTarget, ReviewComment, SessionStatus } from '@domain'
import type { Observable } from 'rxjs'

export interface ClaudeSessionViewModel {
  readonly status$: Observable<SessionStatus>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly isSessionActive$: Observable<boolean>
  startSession(worktreePath: string): void
  stopSession(worktreePath: string): void
  sendCommand(worktreePath: string, input: string): void
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
