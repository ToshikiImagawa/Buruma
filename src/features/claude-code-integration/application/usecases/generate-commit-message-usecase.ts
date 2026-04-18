import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export interface GenerateCommitMessageInput {
  worktreePath: string
  diffText: string
  /** AppSettings.commitMessageRules を転送する。null / undefined はデフォルトプロンプトを使用する。 */
  rules?: string | null
}

export class GenerateCommitMessageUseCase implements FunctionUseCase<GenerateCommitMessageInput, Promise<string>> {
  constructor(private readonly repository: ClaudeRepository) {}

  async invoke(input: GenerateCommitMessageInput): Promise<string> {
    return this.repository.generateCommitMessage(input.worktreePath, input.diffText, input.rules ?? null)
  }
}
