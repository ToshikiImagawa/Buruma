import type { ClaudeOutput, SessionStatus } from '@domain'
import type { Observable } from 'rxjs'
import type {
  GetOutputsRendererUseCase,
  GetSessionStatusRendererUseCase,
  SendCommandRendererUseCase,
  StartSessionRendererUseCase,
  StopSessionRendererUseCase,
} from '../di-tokens'
import type { ClaudeSessionViewModel } from './viewmodel-interfaces'
import { map } from 'rxjs/operators'

export class ClaudeSessionDefaultViewModel implements ClaudeSessionViewModel {
  readonly status$: Observable<SessionStatus>
  readonly outputs$: Observable<ClaudeOutput[]>
  readonly isSessionActive$: Observable<boolean>

  constructor(
    private readonly startSessionUseCase: StartSessionRendererUseCase,
    private readonly stopSessionUseCase: StopSessionRendererUseCase,
    private readonly sendCommandUseCase: SendCommandRendererUseCase,
    getStatusUseCase: GetSessionStatusRendererUseCase,
    getOutputsUseCase: GetOutputsRendererUseCase,
  ) {
    this.status$ = getStatusUseCase.store
    this.outputs$ = getOutputsUseCase.store
    this.isSessionActive$ = this.status$.pipe(map((s) => s === 'running' || s === 'starting'))
  }

  startSession(worktreePath: string): void {
    this.startSessionUseCase.invoke(worktreePath)
  }

  stopSession(worktreePath: string): void {
    this.stopSessionUseCase.invoke(worktreePath)
  }

  sendCommand(worktreePath: string, input: string): void {
    this.sendCommandUseCase.invoke({ worktreePath, type: 'general', input })
  }
}
