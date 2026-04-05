import type { ClaudeCommand } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class SendCommandMainUseCase implements FunctionUseCase<ClaudeCommand, Promise<void>> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(command: ClaudeCommand): Promise<void> {
    return this.repository.sendCommand(command)
  }
}
