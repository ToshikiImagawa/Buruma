import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeInfo, WorktreeSortOrder } from '@shared/domain'
import type { Observable } from 'rxjs'

/** ワークツリー一覧 ViewModel インターフェース */
export interface WorktreeListViewModel {
  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedPath$: Observable<string | null>
  selectWorktree(path: string | null): void
  createWorktree(params: WorktreeCreateParams): void
  deleteWorktree(params: WorktreeDeleteParams): void
  refreshWorktrees(): void
  setSortOrder(order: WorktreeSortOrder): void
}

/** ワークツリー詳細 ViewModel インターフェース */
export interface WorktreeDetailViewModel {
  readonly selectedWorktree$: Observable<WorktreeInfo | null>
}
