import type { WorktreeInfo } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { Observable } from 'rxjs'
import type { IWorktreeService } from '../services/worktree-service-interface'

export class ListWorktreesUseCaseImpl implements ObservableStoreUseCase<WorktreeInfo[]> {
  constructor(private readonly service: IWorktreeService) {}

  get store(): Observable<WorktreeInfo[]> {
    return this.service.worktrees$
  }
}
