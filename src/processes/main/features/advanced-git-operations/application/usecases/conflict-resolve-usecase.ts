import type { ConflictResolveOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class ConflictResolveUseCase implements ConsumerUseCase<ConflictResolveOptions> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: ConflictResolveOptions): Promise<void> {
    await this.repository.conflictResolve(input)
  }
}
