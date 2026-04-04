import type { ConflictResolveAllOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class ConflictResolveAllUseCase implements ConsumerUseCase<ConflictResolveAllOptions> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  invoke(input: ConflictResolveAllOptions): void {
    this.repository.conflictResolveAll(input)
  }
}
