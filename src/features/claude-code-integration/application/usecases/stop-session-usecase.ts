import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from '../services/claude-service-interface'

export class StopSessionUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly service: ClaudeService,
  ) {}

  invoke(sessionId: string): void {
    this.repository
      .stopSession(sessionId)
      .then(() => this.service.updateSession(null))
      .catch(() => {
        // エラーは IPC イベント経由で session-changed として通知される
      })
  }
}
