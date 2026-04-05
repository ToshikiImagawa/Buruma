import type { ClaudeSession } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class GetSessionMainUseCase implements FunctionUseCase<string, ClaudeSession | null> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(worktreePath: string): ClaudeSession | null {
    return this.repository.getSession(worktreePath)
  }
}
