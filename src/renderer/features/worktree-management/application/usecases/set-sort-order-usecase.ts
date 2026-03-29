import type { WorktreeSortOrder } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeService } from '../services/worktree-service-interface'

export class SetSortOrderUseCaseImpl implements ConsumerUseCase<WorktreeSortOrder> {
  constructor(private readonly service: IWorktreeService) {}

  invoke(order: WorktreeSortOrder): void {
    this.service.setSortOrder(order)
  }
}
