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
import type { IPCError } from '@lib/ipc'
import type { GitOperationsRepository } from '../../application/repositories/git-operations-repository'
import { invokeCommand } from '@lib/invoke/commands'

export class GitOperationsDefaultRepository implements GitOperationsRepository {
  async stage(worktreePath: string, files: string[]): Promise<void> {
    const result = await invokeCommand<void>('git_stage', { args: { worktreePath, files } })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async stageAll(worktreePath: string): Promise<void> {
    const result = await invokeCommand<void>('git_stage_all', { args: { worktreePath } })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async unstage(worktreePath: string, files: string[]): Promise<void> {
    const result = await invokeCommand<void>('git_unstage', { args: { worktreePath, files } })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async unstageAll(worktreePath: string): Promise<void> {
    const result = await invokeCommand<void>('git_unstage_all', { args: { worktreePath } })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async commit(args: CommitArgs): Promise<CommitResult> {
    const result = await invokeCommand<CommitResult>('git_commit', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async push(args: PushArgs): Promise<PushResult> {
    const result = await invokeCommand<PushResult>('git_push', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async pull(args: PullArgs): Promise<PullResult> {
    const result = await invokeCommand<PullResult>('git_pull', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async fetch(args: FetchArgs): Promise<FetchResult> {
    const result = await invokeCommand<FetchResult>('git_fetch', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async branchCreate(args: BranchCreateArgs): Promise<void> {
    const result = await invokeCommand<void>('git_branch_create', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async branchCheckout(args: BranchCheckoutArgs): Promise<void> {
    const result = await invokeCommand<void>('git_branch_checkout', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async branchDelete(args: BranchDeleteArgs): Promise<void> {
    const result = await invokeCommand<void>('git_branch_delete', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async reset(args: ResetArgs): Promise<void> {
    const result = await invokeCommand<void>('git_reset', { args })
    if (result.success === false) throw new GitOperationsError(result.error)
  }
}

export class GitOperationsError extends Error {
  readonly code: string

  constructor(error: IPCError) {
    super(error.message)
    this.name = 'GitOperationsError'
    this.code = error.code
  }
}
