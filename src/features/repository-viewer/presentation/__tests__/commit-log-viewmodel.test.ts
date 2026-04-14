import type { CommitDetail, CommitSummary, GitLogResult } from '@domain'
import type { RepositoryViewerService } from '../../application/services/repository-viewer-service-interface'
import type { GetCommitDetailUseCase, GetLogUseCase } from '../../di-tokens'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommitLogDefaultViewModel } from '../commit-log-viewmodel'

function createMockGetLogUseCase(): GetLogUseCase {
  return { invoke: vi.fn() }
}

function createMockGetCommitDetailUseCase(): GetCommitDetailUseCase {
  return { invoke: vi.fn() }
}

function createMockService(): RepositoryViewerService {
  return {
    selectFile: vi.fn(),
    selectCommit: vi.fn(),
    setCommits: vi.fn(),
    appendCommits: vi.fn(),
    setDiffs: vi.fn(),
    setDiffDisplayMode: vi.fn(),
    setLogSearch: vi.fn(),
    setBranchSearch: vi.fn(),
    setUp: vi.fn(),
    tearDown: vi.fn(),
    selectedCommitHash$: new BehaviorSubject<string | null>(null),
    commits$: new BehaviorSubject<CommitSummary[]>([]),
    hasMoreCommits$: new BehaviorSubject(false),
    selectedFilePath$: new BehaviorSubject<string | null>(null),
    selectedFileStaged$: new BehaviorSubject(false),
    diffs$: new BehaviorSubject([]),
    diffDisplayMode$: new BehaviorSubject<'inline' | 'split'>('inline'),
    logSearch$: new BehaviorSubject(''),
    branchSearch$: new BehaviorSubject(''),
  }
}

function createCommitSummary(overrides: Partial<CommitSummary> = {}): CommitSummary {
  return {
    hash: 'abc1234',
    message: 'test commit',
    author: 'Test User',
    date: '2026-01-01',
    ...overrides,
  }
}

function createCommitDetail(overrides: Partial<CommitDetail> = {}): CommitDetail {
  return {
    hash: 'abc1234',
    message: 'test commit',
    author: 'Test User',
    date: '2026-01-01',
    body: '',
    files: [],
    ...overrides,
  }
}

describe('CommitLogDefaultViewModel', () => {
  let getLogUseCase: ReturnType<typeof createMockGetLogUseCase>
  let getCommitDetailUseCase: ReturnType<typeof createMockGetCommitDetailUseCase>
  let service: ReturnType<typeof createMockService>
  let vm: CommitLogDefaultViewModel

  beforeEach(() => {
    vi.clearAllMocks()
    getLogUseCase = createMockGetLogUseCase()
    getCommitDetailUseCase = createMockGetCommitDetailUseCase()
    service = createMockService()
    vm = new CommitLogDefaultViewModel(getLogUseCase, getCommitDetailUseCase, service)
  })

  it('初期値は commits$ が [], loading$ が false', async () => {
    const commits = await firstValueFrom(vm.commits$)
    const loading = await firstValueFrom(vm.loading$)

    expect(commits).toEqual([])
    expect(loading).toBe(false)
  })

  it('loadCommits で最初の50件を取得', async () => {
    const commits = [createCommitSummary()]
    const logResult: GitLogResult = { commits, hasMore: false }
    vi.mocked(getLogUseCase.invoke).mockResolvedValue(logResult)

    vm.loadCommits('/repo')

    expect(getLogUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      offset: 0,
      limit: 50,
      search: undefined,
    })

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.commits$)
      expect(result).toEqual(commits)
    })

    expect(service.setCommits).toHaveBeenCalledWith(commits, false)
  })

  it('loadMore で既存コミットに追加', async () => {
    // まず初期データをロード
    const initialCommits = [createCommitSummary({ hash: 'aaa' })]
    vi.mocked(getLogUseCase.invoke).mockResolvedValue({ commits: initialCommits, hasMore: true })
    vm.loadCommits('/repo')
    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.commits$)
      expect(result).toHaveLength(1)
    })

    // 追加データをロード
    const moreCommits = [createCommitSummary({ hash: 'bbb' })]
    vi.mocked(getLogUseCase.invoke).mockResolvedValue({ commits: moreCommits, hasMore: false })
    vm.loadMore('/repo')

    expect(getLogUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      offset: 1,
      limit: 50,
      search: undefined,
    })

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.commits$)
      expect(result).toHaveLength(2)
    })

    expect(service.appendCommits).toHaveBeenCalledWith(moreCommits, false)
  })

  it('selectCommit で詳細を取得', async () => {
    const detail = createCommitDetail({ hash: 'abc1234' })
    vi.mocked(getCommitDetailUseCase.invoke).mockResolvedValue(detail)

    vm.selectCommit('/repo', 'abc1234')

    expect(service.selectCommit).toHaveBeenCalledWith('abc1234')
    expect(getCommitDetailUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      hash: 'abc1234',
    })

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.selectedCommit$)
      expect(result).toEqual(detail)
    })
  })

  it('setSearch で service.setLogSearch が呼ばれる', () => {
    vm.setSearch('fix bug')

    expect(service.setLogSearch).toHaveBeenCalledWith('fix bug')
  })
})
