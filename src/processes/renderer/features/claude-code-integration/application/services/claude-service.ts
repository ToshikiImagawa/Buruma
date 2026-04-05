import type { ClaudeOutput, ClaudeSession, SessionStatus } from '@domain'
import type { Observable } from 'rxjs'
import type { ClaudeService } from './claude-service-interface'
import { BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

const MAX_OUTPUT_BUFFER = 1000

export class ClaudeDefaultService implements ClaudeService {
  private readonly _currentSession$ = new BehaviorSubject<ClaudeSession | null>(null)
  private readonly _outputs$ = new BehaviorSubject<ClaudeOutput[]>([])

  readonly currentSession$: Observable<ClaudeSession | null>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly status$: Observable<SessionStatus>

  constructor() {
    this.currentSession$ = this._currentSession$.asObservable()
    this.outputs$ = this._outputs$.asObservable()
    this.status$ = this._currentSession$.pipe(map((s) => s?.status ?? 'idle'))
  }

  setUp(): void {
    // Initial state already set by BehaviorSubject defaults
  }

  tearDown(): void {
    this._currentSession$.complete()
    this._outputs$.complete()
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
}
