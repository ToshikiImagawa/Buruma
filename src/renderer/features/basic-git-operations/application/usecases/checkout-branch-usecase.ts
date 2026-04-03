import type { BranchCheckoutArgs } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { GitOperationsRepository } from '../repositories/git-operations-repository'
import type { GitOperationsService } from '../services/git-operations-service-interface'

export class CheckoutBranchUseCase implements ConsumerUseCase<BranchCheckoutArgs> {
  constructor(
    private readonly repository: GitOperationsRepository,
    private readonly service: GitOperationsService,
  ) {}

  invoke(input: BranchCheckoutArgs): void {
    this.service.setLoading(true)
    this.service.clearError()
    this.repository
      .branchCheckout(input)
      .catch((error: unknown) => {
        this.service.setError({
          code: 'CHECKOUT_FAILED',
          message: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        this.service.setLoading(false)
      })
  }
}
