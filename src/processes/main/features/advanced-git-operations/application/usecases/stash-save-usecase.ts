import type { StashSaveOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class StashSaveUseCase implements ConsumerUseCase<StashSaveOptions> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: StashSaveOptions): Promise<void> {
    await this.repository.stashSave(input)
  }
}
