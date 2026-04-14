import type { CommitResult, PullResult, PushResult } from '@domain'
import type { IPCError } from '@lib/ipc'
import type { Observable } from 'rxjs'

export interface StagingViewModel {
  readonly loading$: Observable<boolean>
  stageFiles(worktreePath: string, files: string[]): void
  unstageFiles(worktreePath: string, files: string[]): void
  stageAll(worktreePath: string): void
  unstageAll(worktreePath: string): void
}

export interface CommitViewModel {
  readonly loading$: Observable<boolean>
  readonly generating$: Observable<boolean>
  readonly generateError$: Observable<string | null>
  readonly lastCommitResult$: Observable<CommitResult | null>
  commit(worktreePath: string, message: string, amend?: boolean): Promise<CommitResult | null>
  generateCommitMessage(worktreePath: string): Promise<string>
}

export interface RemoteOpsViewModel {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>
  readonly lastPushResult$: Observable<PushResult | null>
  readonly lastPullResult$: Observable<PullResult | null>
  push(worktreePath: string, remote?: string, branch?: string, setUpstream?: boolean): Promise<PushResult | null>
  pull(worktreePath: string, remote?: string, branch?: string): void
  fetch(worktreePath: string, remote?: string): void
}

export interface BranchOpsViewModel {
  readonly loading$: Observable<boolean>
  readonly lastError$: Observable<IPCError | null>
  createBranch(worktreePath: string, name: string, startPoint?: string): void
  checkoutBranch(worktreePath: string, branch: string): void
  deleteBranch(worktreePath: string, branch: string, remote?: boolean, force?: boolean): void
  resetToCommit(worktreePath: string, target: string, mode: 'soft' | 'mixed' | 'hard'): void
}
