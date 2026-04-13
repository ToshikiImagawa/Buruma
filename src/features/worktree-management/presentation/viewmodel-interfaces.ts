import type {
  BranchList,
  RecoveryRequest,
  SymlinkConfig,
  WorktreeCreateParams,
  WorktreeCreateResult,
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
  createWorktree(params: WorktreeCreateParams): Promise<WorktreeCreateResult>
  deleteWorktree(params: WorktreeDeleteParams): void
  refreshWorktrees(): void
  setSortOrder(order: WorktreeSortOrder): void
  getBranches(worktreePath: string): Promise<BranchList>
  getSymlinkConfig(repoPath: string): Promise<SymlinkConfig>
  suggestPath(repoPath: string, branch: string): Promise<string>
  dismissRecovery(): void
}

/** ワークツリー詳細 ViewModel インターフェース */
export interface WorktreeDetailViewModel {
  readonly selectedWorktree$: Observable<WorktreeInfo | null>
}

/** シンボリックリンク設定 ViewModel インターフェース */
export interface SymlinkSettingsViewModel {
  readonly config$: Observable<SymlinkConfig | null>
  loadConfig(repoPath: string): void
  addPattern(repoPath: string, pattern: string): void
  removePattern(repoPath: string, index: number): void
}
