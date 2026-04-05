import type { ClaudeOutput } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class GetOutputMainUseCase implements FunctionUseCase<string, ClaudeOutput[]> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(worktreePath: string): ClaudeOutput[] {
    return this.repository.getOutputHistory(worktreePath)
  }
}
