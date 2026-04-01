import type {
  BranchInfo,
  BranchList,
  CommitDetail,
  CommitFileChange,
  CommitSummary,
  FileChangeStatus,
  FileContents,
  FileDiff,
  FileTreeNode,
  GitDiffQuery,
  GitLogQuery,
  GitLogResult,
  GitStatus,
} from '@shared/domain'
import type { BranchSummary } from 'simple-git'
import type { GitReadRepository } from '../../application/repositories/git-read-repository'
import { detectLanguageFromPath } from '@shared/lib/detect-language'
import simpleGit from 'simple-git'
import { parseDiffOutput } from './diff-parser'
import { buildFileTree } from './file-tree-builder'

export class GitReadDefaultRepository implements GitReadRepository {
  async getStatus(worktreePath: string): Promise<GitStatus> {
    const git = simpleGit(worktreePath)
    const raw = await git.raw(['status', '--porcelain=v1'])
    return parseStatusOutput(raw)
  }

  async getLog(query: GitLogQuery): Promise<GitLogResult> {
    const git = simpleGit(query.worktreePath)

    const options: string[] = [
      'log',
      '--all',
      `--max-count=${query.limit}`,
      `--skip=${query.offset}`,
      '--format=%H%n%h%n%s%n%an%n%ae%n%aI%n%P',
    ]

    if (query.search) {
      options.push(`--grep=${query.search}`)
    }

    const raw = await git.raw(options)
    const commits = parseLogOutput(raw)

    // 総コミット数を取得
    const countArgs = ['rev-list', '--count', '--all']
    if (query.search) {
      countArgs.push(`--grep=${query.search}`)
    }
    let total: number
    try {
      total = parseInt((await git.raw(countArgs)).trim(), 10)
    } catch {
      total = commits.length
    }

    return {
      commits,
      total,
      hasMore: commits.length === query.limit,
    }
  }

  async getCommitDetail(worktreePath: string, hash: string): Promise<CommitDetail> {
    const git = simpleGit(worktreePath)

    // コミット情報
    const logRaw = await git.raw(['log', '-1', '--format=%H%n%h%n%s%n%an%n%ae%n%aI%n%P', hash])
    const commits = parseLogOutput(logRaw)
    if (commits.length === 0) {
      throw new Error(`Commit not found: ${hash}`)
    }
    const summary = commits[0]

    // 変更ファイル（ステータス + 行数統計）
    const nameStatusRaw = await git.raw(['diff-tree', '--no-commit-id', '-r', '--name-status', hash])
    const numstatRaw = await git.raw(['diff-tree', '--no-commit-id', '-r', '--numstat', hash])
    const files = parseCommitFiles(nameStatusRaw, numstatRaw)

    return { ...summary, files }
  }

  async getDiff(query: GitDiffQuery): Promise<FileDiff[]> {
    const git = simpleGit(query.worktreePath)
    const args = query.filePath ? ['--', query.filePath] : []
    const raw = await git.diff(args)
    return parseDiffOutput(raw)
  }

  async getDiffStaged(query: GitDiffQuery): Promise<FileDiff[]> {
    const git = simpleGit(query.worktreePath)
    const args = ['--cached', ...(query.filePath ? ['--', query.filePath] : [])]
    const raw = await git.diff(args)
    return parseDiffOutput(raw)
  }

  async getDiffCommit(worktreePath: string, hash: string, filePath?: string): Promise<FileDiff[]> {
    const git = simpleGit(worktreePath)
    // 初回コミット対応: parent が無い場合は空ツリーと比較
    let parentHash: string
    try {
      parentHash = (await git.raw(['rev-parse', `${hash}^`])).trim()
    } catch {
      // 初回コミット
      parentHash = '4b825dc642cb6eb9a060e54bf899d69f245b189' // git empty tree hash
    }
    const args = [parentHash, hash, ...(filePath ? ['--', filePath] : [])]
    const raw = await git.diff(args)
    return parseDiffOutput(raw)
  }

  async getBranches(worktreePath: string): Promise<BranchList> {
    const git = simpleGit(worktreePath)
    const result: BranchSummary = await git.branch(['-a', '-v', '--abbrev'])
    return mapBranchResult(result)
  }

  async getFileTree(worktreePath: string): Promise<FileTreeNode> {
    const git = simpleGit(worktreePath)
    const lsTreeRaw = await git.raw(['ls-tree', '-r', '--name-only', 'HEAD'])
    const statusRaw = await git.raw(['status', '--porcelain=v1'])

    // status からファイルごとの変更ステータスを構築
    const statusMap = buildStatusMap(statusRaw)

    const rootName = worktreePath.split('/').pop() ?? 'root'
    return buildFileTree(lsTreeRaw, statusMap, rootName)
  }

  async getFileContents(worktreePath: string, filePath: string, staged?: boolean): Promise<FileContents> {
    const git = simpleGit(worktreePath)
    const language = detectLanguageFromPath(filePath)

    // 変更前: HEAD のファイル内容
    let original = ''
    try {
      original = await git.raw(['show', `HEAD:${filePath}`])
    } catch {
      // 新規ファイルの場合は空
    }

    // 変更後: staged なら index の内容、そうでなければ作業ツリーの内容
    let modified: string
    if (staged) {
      try {
        modified = await git.raw(['show', `:${filePath}`])
      } catch {
        modified = ''
      }
    } else {
      const fs = await import('node:fs/promises')
      const nodePath = await import('node:path')
      const resolved = await fs.realpath(nodePath.join(worktreePath, filePath)).catch(() => '')
      const resolvedRoot = await fs.realpath(worktreePath).catch(() => '')
      if (!resolved || !resolvedRoot || (!resolved.startsWith(resolvedRoot + nodePath.sep) && resolved !== resolvedRoot)) {
        modified = ''
      } else {
        try {
          modified = await fs.readFile(resolved, 'utf-8')
        } catch {
          modified = ''
        }
      }
    }

    return { original, modified, language }
  }

  async getFileContentsCommit(worktreePath: string, hash: string, filePath: string): Promise<FileContents> {
    const git = simpleGit(worktreePath)
    const language = detectLanguageFromPath(filePath)

    // 変更前: 親コミットのファイル内容
    let original = ''
    try {
      original = await git.raw(['show', `${hash}^:${filePath}`])
    } catch {
      // 初回コミット or ファイル新規追加
    }

    // 変更後: 指定コミットのファイル内容
    let modified = ''
    try {
      modified = await git.raw(['show', `${hash}:${filePath}`])
    } catch {
      // ファイル削除の場合
    }

    return { original, modified, language }
  }
}

// --- ヘルパー関数 ---

function parseStatusOutput(raw: string): GitStatus {
  const staged: GitStatus['staged'] = []
  const unstaged: GitStatus['unstaged'] = []
  const untracked: string[] = []

  for (const line of raw.split('\n')) {
    if (line.length < 3) continue

    const index = line[0]
    const workTree = line[1]
    const filePath = line.slice(3)

    if (index === '?' && workTree === '?') {
      untracked.push(filePath)
      continue
    }
    if (index !== ' ' && index !== '?') {
      staged.push({ path: filePath, status: toFileChangeStatus(index) })
    }
    if (workTree !== ' ' && workTree !== '?') {
      unstaged.push({ path: filePath, status: toFileChangeStatus(workTree) })
    }
  }

  return { staged, unstaged, untracked }
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

function parseLogOutput(raw: string): CommitSummary[] {
  const commits: CommitSummary[] = []
  const lines = raw.split('\n').filter((l) => l.length > 0)

  // 7行ずつ: hash, hashShort, message, author, authorEmail, date, parents
  for (let i = 0; i + 6 <= lines.length; i += 7) {
    commits.push({
      hash: lines[i],
      hashShort: lines[i + 1],
      message: lines[i + 2],
      author: lines[i + 3],
      authorEmail: lines[i + 4],
      date: lines[i + 5],
      parents: lines[i + 6]?.split(' ').filter((p) => p.length > 0) ?? [],
    })
  }

  return commits
}

function parseCommitFiles(nameStatusRaw: string, numstatRaw: string): CommitFileChange[] {
  // numstat から additions/deletions を取得（パス → {additions, deletions}）
  const statMap = new Map<string, { additions: number; deletions: number }>()
  for (const line of numstatRaw.split('\n')) {
    const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/)
    if (match) {
      statMap.set(match[3], {
        additions: match[1] === '-' ? 0 : parseInt(match[1], 10),
        deletions: match[2] === '-' ? 0 : parseInt(match[2], 10),
      })
    }
  }

  const files: CommitFileChange[] = []
  for (const line of nameStatusRaw.split('\n')) {
    if (line.length < 2) continue
    const status = line[0]
    const filePath = line.slice(1).trim()
    if (!filePath) continue

    const stat = statMap.get(filePath)
    files.push({
      path: filePath,
      status: toFileChangeStatus(status),
      additions: stat?.additions ?? 0,
      deletions: stat?.deletions ?? 0,
    })
  }

  return files
}

function mapBranchResult(result: BranchSummary): BranchList {
  const local: BranchInfo[] = []
  const remote: BranchInfo[] = []

  for (const [name, data] of Object.entries(result.branches)) {
    const info: BranchInfo = {
      name: name.replace(/^remotes\//, ''),
      hash: data.commit,
      isHead: data.current,
    }

    if (name.startsWith('remotes/')) {
      remote.push(info)
    } else {
      local.push(info)
    }
  }

  return {
    current: result.current,
    local,
    remote,
  }
}

function buildStatusMap(statusRaw: string): Map<string, FileChangeStatus> {
  const map = new Map<string, FileChangeStatus>()
  for (const line of statusRaw.split('\n')) {
    if (line.length < 3) continue
    const index = line[0]
    const workTree = line[1]
    const filePath = line.slice(3)

    if (index === '?' && workTree === '?') {
      // untracked はファイルツリーでは changeStatus を付けない（Git 管理外）
      continue
    }
    // index or workTree の変更ステータスを使用（index 優先）
    if (index !== ' ' && index !== '?') {
      map.set(filePath, toFileChangeStatus(index))
    } else if (workTree !== ' ') {
      map.set(filePath, toFileChangeStatus(workTree))
    }
  }
  return map
}
