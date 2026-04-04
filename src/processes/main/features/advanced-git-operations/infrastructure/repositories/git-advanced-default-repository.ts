import type {
  MergeOptions,
  MergeResult,
  MergeStatus,
  GitProgressEvent,
  ConflictFile,
  ThreeWayContent,
  ConflictResolveOptions,
  ConflictResolveAllOptions,
  RebaseOptions,
  RebaseResult,
  InteractiveRebaseOptions,
  RebaseStep,
  StashSaveOptions,
  StashEntry,
  CherryPickOptions,
  CherryPickResult,
  TagInfo,
  TagCreateOptions,
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

  // --- スタッシュ ---

  async stashSave(options: StashSaveOptions): Promise<void> {
    const git = simpleGit(options.worktreePath)
    const args = ['stash', 'push']
    if (options.message) {
      args.push('-m', options.message)
    }
    if (options.includeUntracked) {
      args.push('--include-untracked')
    }
    await git.raw(args)
  }

  async stashList(worktreePath: string): Promise<StashEntry[]> {
    const git = simpleGit(worktreePath)
    const result = await git.stashList()
    return result.all.map((entry, index) => ({
      index,
      message: entry.message,
      date: entry.date,
      branch: entry.body || '',
      hash: entry.hash,
    }))
  }

  async stashPop(worktreePath: string, index: number): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.raw(['stash', 'pop', `stash@{${index}}`])
  }

  async stashApply(worktreePath: string, index: number): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.raw(['stash', 'apply', `stash@{${index}}`])
  }

  async stashDrop(worktreePath: string, index: number): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.raw(['stash', 'drop', `stash@{${index}}`])
  }

  async stashClear(worktreePath: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.raw(['stash', 'clear'])
  }

  // --- リベース ---

  async rebase(options: RebaseOptions): Promise<RebaseResult> {
    const git = this.createGitWithProgress(options.worktreePath, 'rebase')
    try {
      await git.rebase([options.onto])
      return { status: 'success' }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('CONFLICT') || message.includes('could not apply')) {
        const status = await git.status()
        return { status: 'conflict', conflictFiles: status.conflicted }
      }
      throw new GitAdvancedOperationError('REBASE_FAILED', message)
    }
  }

  async rebaseInteractive(options: InteractiveRebaseOptions): Promise<RebaseResult> {
    const git = simpleGit(options.worktreePath)
    const todoContent = options.steps
      .sort((a, b) => a.order - b.order)
      .map((step) => `${step.action} ${step.hash} ${step.message}`)
      .join('\n')
    const tmpDir = path.join(options.worktreePath, '.git')
    const todoFile = path.join(tmpDir, 'rebase-todo-tmp')
    try {
      await fs.writeFile(todoFile, todoContent, 'utf-8')
      const editorScript =
        process.platform === 'win32'
          ? `cmd /c "copy /y "${todoFile}" "`
          : `cp "${todoFile}"`
      await git.env('GIT_SEQUENCE_EDITOR', editorScript).rebase(['-i', options.onto])
      return { status: 'success' }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('CONFLICT') || message.includes('could not apply')) {
        const status = await git.status()
        return { status: 'conflict', conflictFiles: status.conflicted }
      }
      throw new GitAdvancedOperationError('REBASE_FAILED', message)
    } finally {
      await fs.unlink(todoFile).catch(() => {})
    }
  }

  async rebaseAbort(worktreePath: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.rebase(['--abort'])
  }

  async rebaseContinue(worktreePath: string): Promise<RebaseResult> {
    const git = simpleGit(worktreePath)
    try {
      await git.rebase(['--continue'])
      return { status: 'success' }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('CONFLICT') || message.includes('could not apply')) {
        const status = await git.status()
        return { status: 'conflict', conflictFiles: status.conflicted }
      }
      throw new GitAdvancedOperationError('REBASE_CONTINUE_FAILED', message)
    }
  }

  async getRebaseCommits(worktreePath: string, onto: string): Promise<RebaseStep[]> {
    const git = simpleGit(worktreePath)
    const log = await git.log({ from: onto, to: 'HEAD' })
    return log.all.map((commit, index) => ({
      hash: commit.hash,
      message: commit.message,
      action: 'pick' as const,
      order: index,
    }))
  }

  // --- チェリーピック ---

  async cherryPick(options: CherryPickOptions): Promise<CherryPickResult> {
    const git = simpleGit(options.worktreePath)
    const appliedCommits: string[] = []
    try {
      for (const commit of options.commits) {
        await git.raw(['cherry-pick', commit])
        appliedCommits.push(commit)
      }
      return { status: 'success', appliedCommits }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('CONFLICT') || message.includes('could not apply')) {
        const status = await git.status()
        return {
          status: 'conflict',
          conflictFiles: status.conflicted,
          appliedCommits,
        }
      }
      throw new GitAdvancedOperationError('CHERRY_PICK_FAILED', message)
    }
  }

  async cherryPickAbort(worktreePath: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.raw(['cherry-pick', '--abort'])
  }

  // --- タグ ---

  async tagList(worktreePath: string): Promise<TagInfo[]> {
    const git = simpleGit(worktreePath)
    const result = await git.tags()
    const tags: TagInfo[] = []
    for (const tagName of result.all) {
      const info = await git.raw(['tag', '-l', '--format=%(objecttype)%09%(creatordate:iso)%09%(*objectname)%09%(contents:subject)%09%(taggername)', tagName])
      const parts = info.trim().split('\t')
      const isAnnotated = parts[0] === 'tag'
      const hash = await git.raw(['rev-list', '-1', tagName]).then((h) => h.trim())
      tags.push({
        name: tagName,
        hash,
        date: parts[1] || new Date().toISOString(),
        type: isAnnotated ? 'annotated' : 'lightweight',
        message: isAnnotated ? parts[3] || undefined : undefined,
        tagger: isAnnotated ? parts[4] || undefined : undefined,
      })
    }
    return tags
  }

  async tagCreate(options: TagCreateOptions): Promise<void> {
    const git = simpleGit(options.worktreePath)
    const target = options.commitHash || 'HEAD'
    if (options.type === 'annotated' && options.message) {
      await git.tag(['-a', options.tagName, '-m', options.message, target])
    } else {
      await git.tag([options.tagName, target])
    }
  }

  async tagDelete(worktreePath: string, tagName: string): Promise<void> {
    const git = simpleGit(worktreePath)
    await git.tag(['-d', tagName])
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
