import type { InteractiveRebaseOptions, RebaseResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class RebaseInteractiveUseCase implements FunctionUseCase<InteractiveRebaseOptions, Promise<RebaseResult>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: InteractiveRebaseOptions): Promise<RebaseResult> {
    return this.repository.rebaseInteractive(input)
  }
}
