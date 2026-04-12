import type {
  BranchCheckoutArgs,
  BranchCreateArgs,
  BranchDeleteArgs,
  CommitArgs,
  CommitResult,
  FetchArgs,
  FetchResult,
  PullArgs,
  PullResult,
  PushArgs,
  PushResult,
  ResetArgs,
} from '@domain'

/** Rust バックエンドが返す Git 操作固有のエラーコード */
export const GIT_OPERATIONS_ERROR_CODES = {
  BRANCH_NOT_MERGED: 'BRANCH_NOT_MERGED',
} as const

type GitOperationsErrorCode = (typeof GIT_OPERATIONS_ERROR_CODES)[keyof typeof GIT_OPERATIONS_ERROR_CODES]

/** エラーオブジェクトが指定の Git 操作エラーコードを持つか判定 */
export function hasGitOperationsErrorCode(error: unknown, code: GitOperationsErrorCode): boolean {
  return error instanceof Error && 'code' in error && (error as { code: string }).code === code
}

/** Git 操作 IPC クライアントの抽象 */
export interface GitOperationsRepository {
  stage(worktreePath: string, files: string[]): Promise<void>
  stageAll(worktreePath: string): Promise<void>
  unstage(worktreePath: string, files: string[]): Promise<void>
  unstageAll(worktreePath: string): Promise<void>
  commit(args: CommitArgs): Promise<CommitResult>
  push(args: PushArgs): Promise<PushResult>
  pull(args: PullArgs): Promise<PullResult>
  fetch(args: FetchArgs): Promise<FetchResult>
  branchCreate(args: BranchCreateArgs): Promise<void>
  branchCheckout(args: BranchCheckoutArgs): Promise<void>
  branchDelete(args: BranchDeleteArgs): Promise<void>
  reset(args: ResetArgs): Promise<void>
}
