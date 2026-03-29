import type { WorktreeInfo, WorktreeSortOrder } from '@shared/domain'
import type { ParameterizedService } from '@shared/lib/service'
import type { Observable } from 'rxjs'

/** ワークツリー状態管理サービスインターフェース */
export interface IWorktreeService extends ParameterizedService<WorktreeInfo[]> {
  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedWorktreePath$: Observable<string | null>
  readonly sortOrder$: Observable<WorktreeSortOrder>
  updateWorktrees(worktrees: WorktreeInfo[]): void
  setSelectedWorktree(path: string | null): void
  setSortOrder(order: WorktreeSortOrder): void
}
