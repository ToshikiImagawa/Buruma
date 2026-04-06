import type { GenerateTextArgs } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'

export class GenerateTextMainUseCase implements FunctionUseCase<GenerateTextArgs, Promise<string>> {
  constructor(private readonly repository: ClaudeProcessRepository) {}

  invoke(args: GenerateTextArgs): Promise<string> {
    return this.repository.generateText(args.worktreePath, args.prompt)
  }
}
