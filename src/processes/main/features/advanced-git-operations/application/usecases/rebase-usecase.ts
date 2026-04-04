import type { RebaseOptions, RebaseResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class RebaseUseCase implements FunctionUseCase<RebaseOptions, Promise<RebaseResult>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: RebaseOptions): Promise<RebaseResult> {
    return this.repository.rebase(input)
  }
}
