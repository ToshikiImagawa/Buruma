import type { ClaudeCommand } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export class SendCommandUseCase implements ConsumerUseCase<ClaudeCommand> {
  constructor(private readonly repository: ClaudeRepository) {}

  invoke(command: ClaudeCommand): void {
    this.repository.sendCommand(command).catch(() => {
      // エラーハンドリングは将来的にエラーサービス経由で通知
    })
  }
}
