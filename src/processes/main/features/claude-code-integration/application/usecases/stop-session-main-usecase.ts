import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class StopSessionMainUseCase implements FunctionUseCase<string, Promise<void>> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(worktreePath: string): Promise<void> {
    return this.repository.stopSession(worktreePath)
  }
}
