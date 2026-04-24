import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeService } from '../services/claude-service-interface'

export class StartSessionUseCase implements ConsumerUseCase<string> {
  constructor(private readonly service: ClaudeService) {}

  invoke(worktreePath: string): void {
    this.service.createConversation(worktreePath).catch(() => {
      // エラーは IPC イベント経由で通知される
    })
  }
}
