import type { ClaudeAuthStatus, ClaudeOutput, ClaudeSession, SessionStatus } from '@domain'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

export interface ClaudeService extends BaseService {
  readonly currentSession$: Observable<ClaudeSession | null>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly status$: Observable<SessionStatus>
  readonly authStatus$: Observable<ClaudeAuthStatus | null>
  readonly isAuthChecking$: Observable<boolean>
  readonly isLoggingIn$: Observable<boolean>
  updateSession(session: ClaudeSession | null): void
  appendOutput(output: ClaudeOutput): void
  clearOutputs(): void
  setAuthStatus(status: ClaudeAuthStatus | null): void
  setAuthChecking(checking: boolean): void
  setLoggingIn(loggingIn: boolean): void
}
