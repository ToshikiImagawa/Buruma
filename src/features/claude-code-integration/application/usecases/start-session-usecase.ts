import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from '../services/claude-service-interface'

export class StartSessionUseCase implements ConsumerUseCase<string> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly service: ClaudeService,
  ) {}

  invoke(worktreePath: string): void {
    this.repository
      .startSession(worktreePath)
      .then((session) => this.service.updateSession(session))
      .catch(() => {
        // エラーは IPC イベント経由で session-changed として通知される
      })
  }
}
