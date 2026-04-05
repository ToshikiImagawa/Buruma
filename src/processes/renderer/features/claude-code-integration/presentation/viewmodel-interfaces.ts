import type { ClaudeOutput, SessionStatus } from '@domain'
import type { Observable } from 'rxjs'

export interface ClaudeSessionViewModel {
  readonly status$: Observable<SessionStatus>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly isSessionActive$: Observable<boolean>
  startSession(worktreePath: string): void
  stopSession(worktreePath: string): void
  sendCommand(worktreePath: string, input: string): void
}
