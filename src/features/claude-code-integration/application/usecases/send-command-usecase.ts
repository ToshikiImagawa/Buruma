import type { ClaudeCommand } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ClaudeService } from '../services/claude-service-interface'

export class SendCommandUseCase implements ConsumerUseCase<ClaudeCommand> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly service: ClaudeService,
  ) {}

  async invoke(command: ClaudeCommand): Promise<void> {
    const now = new Date().toISOString()
    const sessionId = await this.service.addChatMessage(
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: command.input,
        timestamp: now,
      },
      command.worktreePath,
    )
    // ターミナル表示用にユーザー入力を ClaudeOutput として追加
    this.service.appendOutput({
      worktreePath: command.worktreePath,
      stream: 'stdout',
      content: `> ${command.input}`,
      timestamp: now,
    })
    this.service.setCommandRunning(true, sessionId)
    // model が未指定の場合、Service の selectedModel を使用
    const commandToSend: ClaudeCommand = {
      ...(command.model ? command : { ...command, model: this.service.getSelectedModel() }),
      sessionId,
    }
    this.repository.sendCommand(commandToSend).catch(() => {
      this.service.setCommandRunning(false, sessionId)
    })
  }
}
