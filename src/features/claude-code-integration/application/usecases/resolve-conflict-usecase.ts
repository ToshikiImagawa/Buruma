import type { ConflictResolveAIRequest } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export class ResolveConflictUseCase implements FunctionUseCase<ConflictResolveAIRequest, Promise<void>> {
  constructor(private readonly repository: ClaudeRepository) {}

  async invoke(input: ConflictResolveAIRequest): Promise<void> {
    await this.repository.resolveConflict(input)
  }
}
