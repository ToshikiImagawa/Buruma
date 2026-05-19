import type { ClaudeCommand } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'
import type { ChatHistoryService } from '../services/chat-history-service-interface'
import type { ClaudeStateService } from '../services/claude-state-service-interface'

export class SendCommandUseCase implements ConsumerUseCase<ClaudeCommand> {
  constructor(
    private readonly repository: ClaudeRepository,
    private readonly chatHistory: ChatHistoryService,
    private readonly state: ClaudeStateService,
  ) {}

  async invoke(command: ClaudeCommand): Promise<void> {
    const now = new Date().toISOString()
    const sessionId = await this.chatHistory.addChatMessage(
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: command.input,
        timestamp: now,
      },
      command.worktreePath,
    )
    this.state.appendOutput({
      worktreePath: command.worktreePath,
      stream: 'stdout',
      content: `> ${command.input}`,
      timestamp: now,
    })
    this.state.setCommandRunning(true, sessionId)
    const commandToSend: ClaudeCommand = {
      ...(command.model ? command : { ...command, model: this.state.getSelectedModel() }),
      sessionId,
    }
    this.repository.sendCommand(commandToSend).catch(() => {
      this.state.setCommandRunning(false, sessionId)
    })
  }
}
