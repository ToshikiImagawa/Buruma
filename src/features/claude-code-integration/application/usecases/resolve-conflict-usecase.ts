import type { ConflictResolveAIRequest } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { ClaudeRepository } from '../repositories/claude-repository'

export class ResolveConflictUseCase implements ConsumerUseCase<ConflictResolveAIRequest> {
  constructor(private readonly repository: ClaudeRepository) {}

  async invoke(input: ConflictResolveAIRequest): Promise<void> {
    await this.repository.resolveConflict(input)
  }
}
