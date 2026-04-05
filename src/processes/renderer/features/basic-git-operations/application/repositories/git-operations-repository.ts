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
