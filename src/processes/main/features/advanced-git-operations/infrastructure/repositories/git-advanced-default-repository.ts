import type {
  MergeOptions,
  MergeResult,
  MergeStatus,
  GitProgressEvent,
  ConflictFile,
  ThreeWayContent,
  ConflictResolveOptions,
  ConflictResolveAllOptions,
} from '@domain'
import type { GitAdvancedRepository } from '../../application/repositories/git-advanced-repository'
import simpleGit from 'simple-git'
import * as fs from 'fs/promises'
import * as path from 'path'

export class GitAdvancedDefaultRepository implements GitAdvancedRepository {
  private progressCallback: ((event: GitProgressEvent) => void) | null = null

  setProgressCallback(callback: (event: GitProgressEvent) => void): void {
    this.progressCallback = callback
  }

  private createGitWithProgress(worktreePath: string, operation: string) {
    return simpleGit({
      baseDir: worktreePath,
      progress: ({ stage, progress }) => {
        this.progressCallback?.({
          operation,
          phase: stage,
          progress: progress,
        })
      },
    })
  }

  // --- マージ ---

  async merge(options: MergeOptions): Promise<MergeResult> {
    const git = this.createGitWithProgress(options.worktreePath, 'merge')
    try {
      const mergeArgs = [options.branch]
      if (options.strategy === 'no-ff') {
        mergeArgs.unshift('--no-ff')
      } else {
        mergeArgs.unshift('--ff-only')
      }
      const result = await git.merge(mergeArgs)
      if (result.failed) {
        const status = await git.status()
        return {
          status: 'conflict',
          conflictFiles: status.conflicted,
        }
      }
      return {
        status: 'success',
        mergeCommit: result.merges.length > 0 ? result.merges[0] : undefined,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('Already up to date') || message.includes('Already up-to-date')) {
        return { status: 'already-up-to-date' }
      }
      if (message.includes('CONFLICTS') || message.includes('Merge conflict')) {
        const status = await git.status()
        return {
          status: 'conflict',
          conflictFiles: status.conflicted,
        }
      }
      throw new GitAdvancedOperationError('MERGE_FAILED', message)
    }
  }

  async mergeAbort(worktreePath: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.merge(['--abort'])
  }

  async mergeStatus(worktreePath: string): Promise<MergeStatus> {
    const git = simpleGit(worktreePath)
    try {
      const mergeHead = await git.raw(['rev-parse', '--verify', 'MERGE_HEAD'])
      const status = await git.status()
      return {
        isMerging: mergeHead.trim().length > 0,
        conflictFiles: status.conflicted,
      }
    } catch {
      return { isMerging: false }
    }
  }

  // --- コンフリクト解決 ---

  async conflictList(worktreePath: string): Promise<ConflictFile[]> {
    const git = simpleGit(worktreePath)
    const status = await git.status()
    return status.conflicted.map((filePath) => ({
      filePath,
      status: 'conflicted' as const,
      conflictType: 'content' as const,
    }))
  }

  async conflictFileContent(worktreePath: string, filePath: string): Promise<ThreeWayContent> {
    const git = simpleGit(worktreePath)
    const [base, ours, theirs] = await Promise.all([
      git.show(`:1:${filePath}`).catch(() => ''),
      git.show(`:2:${filePath}`).catch(() => ''),
      git.show(`:3:${filePath}`).catch(() => ''),
    ])
    const mergedPath = path.join(worktreePath, filePath)
    const merged = await fs.readFile(mergedPath, 'utf-8').catch(() => '')
    return { base, ours, theirs, merged }
  }

  async conflictResolve(options: ConflictResolveOptions): Promise<void> {
    const git = simpleGit(options.worktreePath)
    const filePath = path.join(options.worktreePath, options.filePath)
    if (options.resolution.type === 'ours') {
      await git.checkout(['--ours', options.filePath])
    } else if (options.resolution.type === 'theirs') {
      await git.checkout(['--theirs', options.filePath])
    } else {
      await fs.writeFile(filePath, options.resolution.content, 'utf-8')
    }
    await git.add(options.filePath)
  }

  async conflictResolveAll(options: ConflictResolveAllOptions): Promise<void> {
    const git = simpleGit(options.worktreePath)
    const status = await git.status()
    for (const filePath of status.conflicted) {
      if (options.strategy === 'ours') {
        await git.checkout(['--ours', filePath])
      } else {
        await git.checkout(['--theirs', filePath])
      }
      await git.add(filePath)
    }
  }

  async conflictMarkResolved(worktreePath: string, filePath: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.add(filePath)
  }

  // --- stub: 後続 Phase で実装 ---

  async rebase(): Promise<never> {
    throw new Error('Not implemented')
  }
  async rebaseInteractive(): Promise<never> {
    throw new Error('Not implemented')
  }
  async rebaseAbort(): Promise<never> {
    throw new Error('Not implemented')
  }
  async rebaseContinue(): Promise<never> {
    throw new Error('Not implemented')
  }
  async getRebaseCommits(): Promise<never> {
    throw new Error('Not implemented')
  }
  async stashSave(): Promise<never> {
    throw new Error('Not implemented')
  }
  async stashList(): Promise<never> {
    throw new Error('Not implemented')
  }
  async stashPop(): Promise<never> {
    throw new Error('Not implemented')
  }
  async stashApply(): Promise<never> {
    throw new Error('Not implemented')
  }
  async stashDrop(): Promise<never> {
    throw new Error('Not implemented')
  }
  async stashClear(): Promise<never> {
    throw new Error('Not implemented')
  }
  async cherryPick(): Promise<never> {
    throw new Error('Not implemented')
  }
  async cherryPickAbort(): Promise<never> {
    throw new Error('Not implemented')
  }
  async tagList(): Promise<never> {
    throw new Error('Not implemented')
  }
  async tagCreate(): Promise<never> {
    throw new Error('Not implemented')
  }
  async tagDelete(): Promise<never> {
    throw new Error('Not implemented')
  }
}

export class GitAdvancedOperationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'GitAdvancedOperationError'
  }
}
