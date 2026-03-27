import { combineLatest, type Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { WorktreeInfo } from '@shared/domain'
import type { ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeService } from '../../di-tokens'

export class GetSelectedWorktreeUseCaseImpl
  implements ObservableStoreUseCase<WorktreeInfo | null>
{
  constructor(private readonly service: IWorktreeService) {}

  get store(): Observable<WorktreeInfo | null> {
    return combineLatest([this.service.worktrees$, this.service.selectedWorktreePath$]).pipe(
      map(([worktrees, path]) => {
        if (!path) return null
        return worktrees.find((w) => w.path === path) ?? null
      }),
    )
  }
}
