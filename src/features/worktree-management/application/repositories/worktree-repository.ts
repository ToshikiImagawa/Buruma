import type {
  BranchList,
  WorktreeChangeEvent,
  WorktreeCreateParams,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeStatus,
} from '@domain'

/** ワークツリー操作のリポジトリインターフェース（IPC クライアント抽象） */
export interface WorktreeRepository {
  list(repoPath: string): Promise<WorktreeInfo[]>
  getStatus(repoPath: string, worktreePath: string): Promise<WorktreeStatus>
  create(params: WorktreeCreateParams): Promise<WorktreeInfo>
  delete(params: WorktreeDeleteParams): Promise<void>
  suggestPath(repoPath: string, branch: string): Promise<string>
  checkDirty(worktreePath: string): Promise<boolean>
  getBranches(worktreePath: string): Promise<BranchList>
  onChanged(callback: (event: WorktreeChangeEvent) => void): () => void
}
