import type { ClaudeOutput, ClaudeSession, SessionStatus } from '@domain'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

export interface ClaudeService extends BaseService {
  readonly currentSession$: Observable<ClaudeSession | null>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly status$: Observable<SessionStatus>
  updateSession(session: ClaudeSession | null): void
  appendOutput(output: ClaudeOutput): void
  clearOutputs(): void
}
