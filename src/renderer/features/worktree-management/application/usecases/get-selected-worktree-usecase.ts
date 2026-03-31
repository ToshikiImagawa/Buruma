import type { WorktreeInfo } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { Observable } from 'rxjs'
import type { WorktreeService } from '../services/worktree-service-interface'
import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'

export class GetSelectedWorktreeDefaultUseCase implements ObservableStoreUseCase<WorktreeInfo | null> {
  constructor(private readonly service: WorktreeService) {}

  get store(): Observable<WorktreeInfo | null> {
    return combineLatest([this.service.worktrees$, this.service.selectedWorktreePath$]).pipe(
      map(([worktrees, path]) => {
        if (!path) return null
        return worktrees.find((w) => w.path === path) ?? null
      }),
    )
  }
}
