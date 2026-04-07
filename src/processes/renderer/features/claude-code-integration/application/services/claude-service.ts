import type {
  ClaudeAuthStatus,
  ClaudeOutput,
  ClaudeSession,
  ExplainResult,
  ReviewComment,
  ReviewResult,
  SessionStatus,
} from '@domain'
import type { Observable } from 'rxjs'
import type { ClaudeService } from './claude-service-interface'
import { BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

const MAX_OUTPUT_BUFFER = 1000

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
  }

  updateSession(session: ClaudeSession | null): void {
    this._currentSession$.next(session)
    if (!session || session.status === 'idle') {
      this._outputs$.next([])
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
}
