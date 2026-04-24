import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export class StopSessionUseCase implements ConsumerUseCase<string> {
  constructor(private readonly repository: ClaudeRepository) {}

  invoke(sessionId: string): void {
    this.repository.stopSession(sessionId).catch(() => {
      // エラーは IPC イベント経由で session-changed として通知される
    })
  }
}
