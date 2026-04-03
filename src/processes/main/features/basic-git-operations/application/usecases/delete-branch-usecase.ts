import type { BranchDeleteArgs } from '@domain'
import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class DeleteBranchUseCase implements ConsumerUseCase<BranchDeleteArgs> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: BranchDeleteArgs): Promise<void> {
    await this.repository.branchDelete(input)
  }
}
