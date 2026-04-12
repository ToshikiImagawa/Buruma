import type {
  BranchList,
  RecoveryRequest,
  WorktreeCreateParams,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeSortOrder,
} from '@domain'
import type { Observable } from 'rxjs'

/** ワークツリー一覧 ViewModel インターフェース */
export interface WorktreeListViewModel {
  readonly worktrees$: Observable<WorktreeInfo[]>
  readonly selectedPath$: Observable<string | null>
  readonly recoveryRequest$: Observable<RecoveryRequest | null>
  selectWorktree(path: string | null): void
  createWorktree(params: WorktreeCreateParams): void
  deleteWorktree(params: WorktreeDeleteParams): void
  refreshWorktrees(): void
  setSortOrder(order: WorktreeSortOrder): void
  getBranches(worktreePath: string): Promise<BranchList>
  suggestPath(repoPath: string, branch: string): Promise<string>
  confirmRecovery(): void
  dismissRecovery(): void
}

/** ワークツリー詳細 ViewModel インターフェース */
export interface WorktreeDetailViewModel {
  readonly selectedWorktree$: Observable<WorktreeInfo | null>
}
