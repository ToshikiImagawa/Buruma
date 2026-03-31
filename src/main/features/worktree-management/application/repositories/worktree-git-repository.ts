import type { WorktreeCreateParams, WorktreeInfo, WorktreeStatus } from '@shared/domain'

/** Git worktree 操作のリポジトリインターフェース */
export interface WorktreeGitRepository {
  listWorktrees(repoPath: string): Promise<WorktreeInfo[]>
  getStatus(worktreePath: string): Promise<WorktreeStatus>
  addWorktree(params: WorktreeCreateParams): Promise<WorktreeInfo>
  removeWorktree(worktreePath: string, force: boolean): Promise<void>
  isMainWorktree(worktreePath: string): Promise<boolean>
  isDirty(worktreePath: string): Promise<boolean>
  getDefaultBranch(repoPath: string): Promise<string>
}
