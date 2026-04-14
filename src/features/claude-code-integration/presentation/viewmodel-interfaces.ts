import type {
  ClaudeOutput,
  ConflictResolveResult,
  DiffTarget,
  ReviewComment,
  SessionStatus,
  ThreeWayContent,
} from '@domain'
import type { Observable } from 'rxjs'
import type { ConflictResolvingProgress } from '../application/services/claude-service-interface'

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

export interface ClaudeConflictViewModel {
  readonly isResolvingConflict$: Observable<boolean>
  readonly conflictResult$: Observable<ConflictResolveResult | null>
  readonly resolvingProgress$: Observable<ConflictResolvingProgress | null>
  resolveConflict(worktreePath: string, filePath: string, threeWayContent: ThreeWayContent): void
  resolveAll(worktreePath: string, files: Array<{ filePath: string; threeWayContent: ThreeWayContent }>): void
}
