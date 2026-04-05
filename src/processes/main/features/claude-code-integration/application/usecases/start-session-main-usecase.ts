import type { ClaudeSession } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class StartSessionMainUseCase implements FunctionUseCase<string, Promise<ClaudeSession>> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(worktreePath: string): Promise<ClaudeSession> {
    return this.repository.startSession(worktreePath)
  }
}
