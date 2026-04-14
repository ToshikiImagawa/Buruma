import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from '../services/claude-service-interface'

export class StopSessionUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly service: ClaudeService,
  ) {}

  invoke(worktreePath: string): void {
    this.repository
      .stopSession(worktreePath)
      .then(() => this.service.updateSession(null))
      .catch(() => {
        // エラーは IPC イベント経由で session-changed として通知される
      })
  }
}
