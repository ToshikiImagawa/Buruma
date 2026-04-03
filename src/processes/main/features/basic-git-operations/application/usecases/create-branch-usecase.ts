import type { BranchCreateArgs } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class CreateBranchUseCase implements ConsumerUseCase<BranchCreateArgs> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: BranchCreateArgs): Promise<void> {
    await this.repository.branchCreate(input)
  }
}
