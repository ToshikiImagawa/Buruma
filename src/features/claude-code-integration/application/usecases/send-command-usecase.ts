import type { ClaudeCommand } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from '../services/claude-service-interface'

export class SendCommandUseCase implements ConsumerUseCase<ClaudeCommand> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly service: ClaudeService,
  ) {}

  invoke(command: ClaudeCommand): void {
    const now = new Date().toISOString()
    this.service.addChatMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: command.input,
      timestamp: now,
    })
    // ターミナル表示用にユーザー入力を ClaudeOutput として追加
    this.service.appendOutput({
      worktreePath: command.worktreePath,
      stream: 'stdout',
      content: `> ${command.input}`,
      timestamp: now,
    })
    this.service.setCommandRunning(true)
    // model が未指定の場合、Service の selectedModel を使用
    const commandWithModel: ClaudeCommand = command.model
      ? command
      : { ...command, model: this.service.getSelectedModel() }
    this.repository.sendCommand(commandWithModel).catch(() => {
      this.service.setCommandRunning(false)
    })
  }
}
