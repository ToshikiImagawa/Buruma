import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ChatHistoryService } from '../services/chat-history-service-interface'

export class StartSessionUseCase implements ConsumerUseCase<string> {
  constructor(private readonly chatHistory: ChatHistoryService) {}

  invoke(worktreePath: string): void {
    this.chatHistory.createConversation(worktreePath).catch(() => {
      // エラーは IPC イベント経由で通知される
    })
  }
}
