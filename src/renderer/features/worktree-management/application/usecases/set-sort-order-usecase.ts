import type { WorktreeSortOrder } from '@shared/domain'
import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { WorktreeService } from '../services/worktree-service-interface'

export class SetSortOrderDefaultUseCase implements ConsumerUseCase<WorktreeSortOrder> {
  constructor(private readonly service: WorktreeService) {}

  invoke(order: WorktreeSortOrder): void {
    this.service.setSortOrder(order)
  }
}
