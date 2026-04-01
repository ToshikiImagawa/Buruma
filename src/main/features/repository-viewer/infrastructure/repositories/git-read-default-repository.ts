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

    // セパレータでコミット境界を明確にする
    const SEP = '---COMMIT_SEP---'
    const FORMAT = `${SEP}%n%H%n%h%n%s%n%an%n%ae%n%aI%n%P`
    const options: string[] = [
      'log',
      '--all',
      '--graph',
      `--max-count=${query.limit}`,
      `--skip=${query.offset}`,
      `--format=${FORMAT}`,
    ]

    if (query.search) {
      options.push(`--grep=${query.search}`)
    }

    const raw = await git.raw(options)
    const commits = parseGraphLogOutput(raw, SEP)

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

    // 変更ファイル
    const nameStatusRaw = await git.raw(['diff-tree', '--no-commit-id', '-r', '--name-status', hash])
    const files = parseCommitFiles(nameStatusRaw)

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
      try {
        const fs = await import('node:fs/promises')
        const path = await import('node:path')
        modified = await fs.readFile(path.join(worktreePath, filePath), 'utf-8')
      } catch {
        modified = ''
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

function detectLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    py: 'python',
    rs: 'rust',
    go: 'go',
    sh: 'shell',
  }
  return langMap[ext ?? ''] ?? 'plaintext'
}

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

/**
 * git log --graph の出力をパースする
 * --graph 付きの場合、各行の先頭にグラフ文字（| * / \等）が付与される
 * セパレータで各コミットの開始を識別する
 */
function parseGraphLogOutput(raw: string, sep: string): CommitSummary[] {
  const commits: CommitSummary[] = []
  const lines = raw.split('\n')

  let currentGraphLines: string[] = []
  let currentDataLines: string[] = []
  let inCommit = false

  for (const line of lines) {
    // グラフ文字を分離: --graph の出力では各行の先頭にグラフ装飾がつく
    const sepIdx = line.indexOf(sep)
    if (sepIdx >= 0) {
      // 前のコミットを保存
      if (inCommit && currentDataLines.length >= 7) {
        commits.push(buildCommitFromData(currentDataLines, currentGraphLines))
      }
      // 新しいコミット開始
      currentGraphLines = [line.slice(0, sepIdx)]
      currentDataLines = []
      inCommit = true
      continue
    }

    if (inCommit) {
      // グラフ部分を抽出（行先頭の非英数字文字列）
      const graphMatch = line.match(/^([|*/\\_ .]+)/)
      const graphPart = graphMatch ? graphMatch[1] : ''
      const dataPart = graphPart ? line.slice(graphPart.length) : line

      currentGraphLines.push(graphPart)
      if (dataPart.length > 0) {
        currentDataLines.push(dataPart)
      }
    }
  }

  // 最後のコミット
  if (inCommit && currentDataLines.length >= 7) {
    commits.push(buildCommitFromData(currentDataLines, currentGraphLines))
  }

  return commits
}

function buildCommitFromData(dataLines: string[], graphLines: string[]): CommitSummary {
  // dataLines: hash, hashShort, message, author, authorEmail, date, parents（7行）
  const graphLine = graphLines
    .filter((g) => g.length > 0)
    .map((g) => g.trimEnd())
    .join('\n')

  return {
    hash: dataLines[0] ?? '',
    hashShort: dataLines[1] ?? '',
    message: dataLines[2] ?? '',
    author: dataLines[3] ?? '',
    authorEmail: dataLines[4] ?? '',
    date: dataLines[5] ?? '',
    parents: dataLines[6]?.split(' ').filter((p) => p.length > 0) ?? [],
    graphLine: graphLine || undefined,
  }
}

function parseCommitFiles(nameStatusRaw: string): CommitFileChange[] {
  const files: CommitFileChange[] = []

  for (const line of nameStatusRaw.split('\n')) {
    if (line.length < 2) continue
    const status = line[0]
    const filePath = line.slice(1).trim()
    if (!filePath) continue

    files.push({
      path: filePath,
      status: toFileChangeStatus(status),
      additions: 0,
      deletions: 0,
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
