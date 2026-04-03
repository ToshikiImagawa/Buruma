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
} from '@domain'
import type { IPCError } from '@lib/ipc'
import type { GitOperationsRepository } from '../../application/repositories/git-operations-repository'

export class GitOperationsDefaultRepository implements GitOperationsRepository {
  async stage(worktreePath: string, files: string[]): Promise<void> {
    const result = await window.electronAPI.git.stage({ worktreePath, files })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async stageAll(worktreePath: string): Promise<void> {
    const result = await window.electronAPI.git.stageAll({ worktreePath })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async unstage(worktreePath: string, files: string[]): Promise<void> {
    const result = await window.electronAPI.git.unstage({ worktreePath, files })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async unstageAll(worktreePath: string): Promise<void> {
    const result = await window.electronAPI.git.unstageAll({ worktreePath })
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async commit(args: CommitArgs): Promise<CommitResult> {
    const result = await window.electronAPI.git.commit(args)
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async push(args: PushArgs): Promise<PushResult> {
    const result = await window.electronAPI.git.push(args)
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async pull(args: PullArgs): Promise<PullResult> {
    const result = await window.electronAPI.git.pull(args)
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async fetch(args: FetchArgs): Promise<FetchResult> {
    const result = await window.electronAPI.git.fetch(args)
    if (result.success === false) throw new GitOperationsError(result.error)
    return result.data
  }

  async branchCreate(args: BranchCreateArgs): Promise<void> {
    const result = await window.electronAPI.git.branchCreate(args)
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async branchCheckout(args: BranchCheckoutArgs): Promise<void> {
    const result = await window.electronAPI.git.branchCheckout(args)
    if (result.success === false) throw new GitOperationsError(result.error)
  }

  async branchDelete(args: BranchDeleteArgs): Promise<void> {
    const result = await window.electronAPI.git.branchDelete(args)
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
