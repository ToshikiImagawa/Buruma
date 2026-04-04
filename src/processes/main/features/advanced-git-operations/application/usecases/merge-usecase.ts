import type { MergeOptions, MergeResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class MergeUseCase implements FunctionUseCase<MergeOptions, Promise<MergeResult>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: MergeOptions): Promise<MergeResult> {
    return this.repository.merge(input)
  }
}
