import type { TagCreateOptions } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class TagCreateUseCase implements ConsumerUseCase<TagCreateOptions> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: TagCreateOptions): Promise<void> {
    await this.repository.tagCreate(input)
  }
}
