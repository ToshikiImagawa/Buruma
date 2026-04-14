import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export class GenerateCommitMessageUseCase implements FunctionUseCase<
  { worktreePath: string; diffText: string },
  Promise<string>
> {
  constructor(private readonly repository: ClaudeRepository) {}

  async invoke(input: { worktreePath: string; diffText: string }): Promise<string> {
    return this.repository.generateCommitMessage(input.worktreePath, input.diffText)
  }
}
