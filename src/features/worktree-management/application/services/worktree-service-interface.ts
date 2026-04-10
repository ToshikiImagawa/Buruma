import type { WorktreeInfo, WorktreeSortOrder } from '@domain'
import type { ParameterizedService } from '@lib/service'
import type { Observable } from 'rxjs'

/** ワークツリー状態管理サービスインターフェース */
export interface WorktreeService extends ParameterizedService<WorktreeInfo[]> {
  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedWorktreePath$: Observable<string | null>
  readonly sortOrder$: Observable<WorktreeSortOrder>
  updateWorktrees(worktrees: WorktreeInfo[]): void
  setSelectedWorktree(path: string | null): void
  setSortOrder(order: WorktreeSortOrder): void
}
