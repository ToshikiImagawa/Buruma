import type { BrowserWindow } from 'electron'
import type {
  WorktreeInfo,
  WorktreeStatus,
  WorktreeCreateParams,
} from '@shared/domain'

/** Git worktree 操作の抽象インターフェース */
export interface IWorktreeGitService {
  listWorktrees(repoPath: string): Promise<WorktreeInfo[]>
  getStatus(worktreePath: string): Promise<WorktreeStatus>
  addWorktree(params: WorktreeCreateParams): Promise<WorktreeInfo>
  removeWorktree(worktreePath: string, force: boolean): Promise<void>
  isMainWorktree(worktreePath: string): Promise<boolean>
  isDirty(worktreePath: string): Promise<boolean>
}

/** ファイルシステム監視の抽象インターフェース */
export interface IWorktreeWatcher {
  start(repoPath: string, window: BrowserWindow): void
  stop(): void
}
