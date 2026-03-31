import type { FileChange, FileChangeStatus, WorktreeCreateParams, WorktreeInfo, WorktreeStatus } from '@shared/domain'
import type { IWorktreeGitRepository } from '../../application/repositories/worktree-git-repository'
import path from 'node:path'
import simpleGit from 'simple-git'

/** git worktree list --porcelain 出力の1エントリ */
interface PorcelainEntry {
  worktree: string
  HEAD: string
  branch: string | null
  bare?: boolean
  detached?: boolean
}

/** --porcelain 出力をパースする */
export function parsePorcelainOutput(raw: string): PorcelainEntry[] {
  const entries: PorcelainEntry[] = []
  let current: Partial<PorcelainEntry> = {}

  for (const line of raw.split('\n')) {
    if (line === '') {
      if (current.worktree && current.HEAD) {
        entries.push(current as PorcelainEntry)
      }
      current = {}
      continue
    }

    if (line.startsWith('worktree ')) {
      current.worktree = line.slice('worktree '.length)
    } else if (line.startsWith('HEAD ')) {
      current.HEAD = line.slice('HEAD '.length)
    } else if (line.startsWith('branch ')) {
      const fullRef = line.slice('branch '.length)
      current.branch = fullRef.replace('refs/heads/', '')
    } else if (line === 'bare') {
      current.bare = true
    } else if (line === 'detached') {
      current.detached = true
      current.branch = null
    }
  }
  // 末尾に空行がない場合への対処
  if (current.worktree && current.HEAD) {
    entries.push(current as PorcelainEntry)
  }

  return entries
}

/** git status --porcelain=v1 の1行をパースする */
function parseStatusLine(line: string): { index: string; workTree: string; path: string } | null {
  if (line.length < 4) return null
  return {
    index: line[0],
    workTree: line[1],
    path: line.slice(3),
  }
}

function toFileChangeStatus(code: string): FileChangeStatus {
  switch (code) {
    case 'A':
      return 'added'
    case 'M':
      return 'modified'
    case 'D':
      return 'deleted'
    case 'R':
      return 'renamed'
    case 'C':
      return 'copied'
    default:
      return 'modified'
  }
}

export class WorktreeGitRepository implements IWorktreeGitRepository {
  async listWorktrees(repoPath: string): Promise<WorktreeInfo[]> {
    const git = simpleGit(repoPath)
    const raw = await git.raw(['worktree', 'list', '--porcelain'])
    const entries = parsePorcelainOutput(raw)

    const worktrees: WorktreeInfo[] = await Promise.all(
      entries
        .filter((e) => !e.bare)
        .map(async (entry) => {
          let headMessage = ''
          try {
            const wtGit = simpleGit(entry.worktree)
            headMessage = (await wtGit.raw(['log', '-1', '--format=%s'])).trim()
          } catch {
            // HEAD が無い場合等
          }

          const isMain = await this.isMainWorktree(entry.worktree)

          return {
            path: entry.worktree,
            branch: entry.branch ?? null,
            head: entry.HEAD?.slice(0, 7) ?? '',
            headMessage,
            isMain,
            isDirty: false, // UseCase 側で並列チェックされる
          }
        }),
    )

    return worktrees
  }

  async getStatus(worktreePath: string): Promise<WorktreeStatus> {
    const git = simpleGit(worktreePath)
    const raw = await git.raw(['status', '--porcelain=v1'])
    const lines = raw.split('\n').filter((l) => l.length > 0)

    const staged: FileChange[] = []
    const unstaged: FileChange[] = []
    const untracked: string[] = []

    for (const line of lines) {
      const parsed = parseStatusLine(line)
      if (!parsed) continue

      if (parsed.index === '?' && parsed.workTree === '?') {
        untracked.push(parsed.path)
        continue
      }
      if (parsed.index !== ' ' && parsed.index !== '?') {
        staged.push({ path: parsed.path, status: toFileChangeStatus(parsed.index) })
      }
      if (parsed.workTree !== ' ' && parsed.workTree !== '?') {
        unstaged.push({ path: parsed.path, status: toFileChangeStatus(parsed.workTree) })
      }
    }

    const worktreeInfo = await this.getWorktreeInfoForPath(worktreePath)

    return { worktree: worktreeInfo, staged, unstaged, untracked }
  }

  async addWorktree(params: WorktreeCreateParams): Promise<WorktreeInfo> {
    const git = simpleGit(params.repoPath)

    if (params.createNewBranch) {
      const args = ['worktree', 'add', '-b', params.branch, params.worktreePath]
      if (params.startPoint) args.push(params.startPoint)
      await git.raw(args)
    } else {
      await git.raw(['worktree', 'add', params.worktreePath, params.branch])
    }

    // 作成後の情報を取得
    return this.getWorktreeInfoForPath(params.worktreePath)
  }

  async removeWorktree(worktreePath: string, force: boolean): Promise<void> {
    // worktree のリポジトリルートを取得（相対パスが返る場合があるため resolve する）
    const wtGit = simpleGit(worktreePath)
    const rawCommonDir = (await wtGit.raw(['rev-parse', '--git-common-dir'])).trim()
    const commonDir = path.resolve(worktreePath, rawCommonDir)
    const git = simpleGit(commonDir.replace(/[/\\]\.git$/, ''))

    const args = ['worktree', 'remove']
    if (force) args.push('--force')
    args.push(worktreePath)
    await git.raw(args)
  }

  async isMainWorktree(worktreePath: string): Promise<boolean> {
    try {
      const git = simpleGit(worktreePath)
      const gitDir = (await git.raw(['rev-parse', '--git-dir'])).trim()
      // メインワークツリーの .git は「.git」ディレクトリそのもの
      // サブワークツリーの .git は「.git/worktrees/<name>」へのファイルパス
      return gitDir === '.git'
    } catch {
      return false
    }
  }

  async getDefaultBranch(repoPath: string): Promise<string> {
    const git = simpleGit(repoPath)
    try {
      // origin/HEAD から追跡するデフォルトブランチを取得
      const ref = (await git.raw(['symbolic-ref', 'refs/remotes/origin/HEAD'])).trim()
      return ref.replace('refs/remotes/origin/', '')
    } catch {
      // origin/HEAD が未設定の場合、main → master の順でフォールバック
      try {
        await git.raw(['rev-parse', '--verify', 'refs/heads/main'])
        return 'main'
      } catch {
        try {
          await git.raw(['rev-parse', '--verify', 'refs/heads/master'])
          return 'master'
        } catch {
          return 'main'
        }
      }
    }
  }

  async isDirty(worktreePath: string): Promise<boolean> {
    try {
      const git = simpleGit(worktreePath)
      const raw = await git.raw(['status', '--porcelain=v1'])
      return raw.trim().length > 0
    } catch {
      return false
    }
  }

  private async getWorktreeInfoForPath(worktreePath: string): Promise<WorktreeInfo> {
    const git = simpleGit(worktreePath)
    let branch: string | null = null
    let head = ''
    let headMessage = ''

    try {
      branch = (await git.raw(['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
      if (branch === 'HEAD') branch = null // detached
    } catch {
      // empty
    }

    try {
      head = (await git.raw(['rev-parse', '--short', 'HEAD'])).trim()
    } catch {
      // empty
    }

    try {
      headMessage = (await git.raw(['log', '-1', '--format=%s'])).trim()
    } catch {
      // empty
    }

    const isMain = await this.isMainWorktree(worktreePath)
    const isDirty = await this.isDirty(worktreePath)

    return { path: worktreePath, branch, head, headMessage, isMain, isDirty }
  }
}
