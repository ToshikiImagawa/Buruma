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
import type { GitWriteRepository } from '../../application/repositories/git-write-repository'
import simpleGit from 'simple-git'

export class GitWriteDefaultRepository implements GitWriteRepository {
  async stage(worktreePath: string, files: string[]): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.add(files)
  }

  async stageAll(worktreePath: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.add('-A')
  }

  async unstage(worktreePath: string, files: string[]): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.raw(['reset', '--', ...files])
  }

  async unstageAll(worktreePath: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.raw(['reset'])
  }

  async commit(args: CommitArgs): Promise<CommitResult> {
    const git = simpleGit(args.worktreePath)
    const result = await git.commit(args.message, undefined, args.amend ? { '--amend': null } : undefined)

    // コミット情報を取得
    const logRaw = await git.raw(['log', '-1', '--format=%H%n%an%n%aI'])
    const lines = logRaw.trim().split('\n')

    return {
      hash: lines[0] ?? result.commit,
      message: args.message,
      author: lines[1] ?? '',
      date: lines[2] ?? new Date().toISOString(),
    }
  }

  async push(args: PushArgs): Promise<PushResult> {
    const git = simpleGit(args.worktreePath)
    const remote = args.remote ?? 'origin'

    try {
      const pushArgs: string[] = ['push']
      if (args.setUpstream) {
        pushArgs.push('-u')
      }
      pushArgs.push(remote)
      if (args.branch) {
        pushArgs.push(args.branch)
      } else if (args.setUpstream) {
        // setUpstream 時はブランチ名を明示的に取得して渡す
        const currentBranch = (await git.raw(['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
        pushArgs.push(currentBranch)
      }
      const raw = await git.raw(pushArgs)

      return {
        remote,
        branch: args.branch ?? '',
        success: true,
        upToDate: raw.includes('Everything up-to-date'),
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('no upstream') || message.includes('--set-upstream')) {
        throw new GitOperationError('NO_UPSTREAM', 'upstream が設定されていません。--set-upstream を使用してください。')
      }
      if (message.includes('rejected') || message.includes('[rejected]')) {
        throw new GitOperationError('PUSH_REJECTED', 'プッシュが拒否されました。先にプルしてください。')
      }
      throw error
    }
  }

  async pull(args: PullArgs): Promise<PullResult> {
    const git = simpleGit(args.worktreePath)
    const remote = args.remote ?? 'origin'

    try {
      const result = await git.pull(remote, args.branch)
      return {
        remote,
        branch: args.branch ?? '',
        summary: {
          changes: result.summary.changes,
          insertions: result.summary.insertions,
          deletions: result.summary.deletions,
        },
        conflicts: [],
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('CONFLICT') || message.includes('conflict')) {
        throw new GitOperationError('PULL_CONFLICT', 'プル時にコンフリクトが発生しました。')
      }
      throw error
    }
  }

  async fetch(args: FetchArgs): Promise<FetchResult> {
    const git = simpleGit(args.worktreePath)
    const remote = args.remote ?? '--all'
    if (args.remote) {
      await git.fetch(args.remote)
    } else {
      await git.fetch(['--all'])
    }
    return { remote }
  }

  async branchCreate(args: BranchCreateArgs): Promise<void> {
    const git = simpleGit(args.worktreePath)
    const branchArgs: string[] = ['branch', args.name]
    if (args.startPoint) {
      branchArgs.push(args.startPoint)
    }
    await git.raw(branchArgs)
  }

  async branchCheckout(args: BranchCheckoutArgs): Promise<void> {
    const git = simpleGit(args.worktreePath)
    await git.checkout(args.branch)
  }

  async branchDelete(args: BranchDeleteArgs): Promise<void> {
    const git = simpleGit(args.worktreePath)
    if (args.remote) {
      await git.raw(['push', 'origin', '--delete', args.branch])
    } else {
      const flag = args.force ? '-D' : '-d'
      await git.raw(['branch', flag, args.branch])
    }
  }
}

export class GitOperationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'GitOperationError'
  }
}
