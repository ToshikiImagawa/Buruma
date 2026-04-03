import type { BranchCheckoutArgs } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class CheckoutBranchUseCase implements ConsumerUseCase<BranchCheckoutArgs> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: BranchCheckoutArgs): Promise<void> {
    await this.repository.branchCheckout(input)
  }
}
