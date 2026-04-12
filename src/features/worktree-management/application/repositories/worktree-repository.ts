import type {
  BranchList,
  WorktreeChangeEvent,
  WorktreeCreateParams,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeStatus,
} from '@domain'

/** Rust バックエンドが返すワークツリー固有のエラーコード */
export const WORKTREE_ERROR_CODES = {
  DIRTY: 'WORKTREE_DIRTY',
  CANNOT_DELETE_MAIN: 'CANNOT_DELETE_MAIN_WORKTREE',
} as const

type WorktreeErrorCode = (typeof WORKTREE_ERROR_CODES)[keyof typeof WORKTREE_ERROR_CODES]

/** エラーオブジェクトが指定のワークツリーエラーコードを持つか判定 */
export function hasWorktreeErrorCode(error: unknown, code: WorktreeErrorCode): boolean {
  return error instanceof Error && 'code' in error && (error as { code: string }).code === code
}

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
