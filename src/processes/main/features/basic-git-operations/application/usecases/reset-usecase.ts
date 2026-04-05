import type { ResetArgs } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class ResetUseCase implements ConsumerUseCase<ResetArgs> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: ResetArgs): Promise<void> {
    await this.repository.reset(input)
  }
}
