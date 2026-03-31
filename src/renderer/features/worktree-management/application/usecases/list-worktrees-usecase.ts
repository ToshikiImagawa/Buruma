import type { WorktreeInfo } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { Observable } from 'rxjs'
import type { WorktreeService } from '../services/worktree-service-interface'

export class ListWorktreesDefaultUseCase implements ObservableStoreUseCase<WorktreeInfo[]> {
  constructor(private readonly service: WorktreeService) {}

  get store(): Observable<WorktreeInfo[]> {
    return this.service.worktrees$
  }
}
