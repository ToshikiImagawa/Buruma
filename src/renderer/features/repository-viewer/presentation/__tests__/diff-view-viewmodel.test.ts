import type { DiffDisplayMode, FileDiff } from '@shared/domain'
import type { RepositoryViewerService } from '../../application/services/repository-viewer-service-interface'
import type { GetDiffCommitUseCase, GetDiffStagedUseCase, GetDiffUseCase } from '../../di-tokens'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffViewDefaultViewModel } from '../diff-view-viewmodel'

function createMockGetDiffUseCase(): GetDiffUseCase {
  return { invoke: vi.fn() }
}

function createMockGetDiffStagedUseCase(): GetDiffStagedUseCase {
  return { invoke: vi.fn() }
}

function createMockGetDiffCommitUseCase(): GetDiffCommitUseCase {
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
    commits$: new BehaviorSubject([]),
    hasMoreCommits$: new BehaviorSubject(false),
    selectedFilePath$: new BehaviorSubject<string | null>(null),
    selectedFileStaged$: new BehaviorSubject(false),
    diffs$: new BehaviorSubject([]),
    diffDisplayMode$: new BehaviorSubject<DiffDisplayMode>('inline'),
    logSearch$: new BehaviorSubject(''),
    branchSearch$: new BehaviorSubject(''),
  }
}

function createFileDiff(overrides: Partial<FileDiff> = {}): FileDiff {
  return {
    filePath: 'src/index.ts',
    hunks: [],
    ...overrides,
  }
}

describe('DiffViewDefaultViewModel', () => {
  let getDiffUseCase: ReturnType<typeof createMockGetDiffUseCase>
  let getDiffStagedUseCase: ReturnType<typeof createMockGetDiffStagedUseCase>
  let getDiffCommitUseCase: ReturnType<typeof createMockGetDiffCommitUseCase>
  let service: ReturnType<typeof createMockService>
  let vm: DiffViewDefaultViewModel

  beforeEach(() => {
    vi.clearAllMocks()
    getDiffUseCase = createMockGetDiffUseCase()
    getDiffStagedUseCase = createMockGetDiffStagedUseCase()
    getDiffCommitUseCase = createMockGetDiffCommitUseCase()
    service = createMockService()
    vm = new DiffViewDefaultViewModel(getDiffUseCase, getDiffStagedUseCase, getDiffCommitUseCase, service)
  })

  it('loadDiff で getDiffUseCase.invoke が呼ばれる', async () => {
    const diffs = [createFileDiff()]
    vi.mocked(getDiffUseCase.invoke).mockResolvedValue(diffs)

    vm.loadDiff('/repo', 'src/index.ts', false)

    expect(getDiffUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      filePath: 'src/index.ts',
    })

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.diffs$)
      expect(result).toEqual(diffs)
    })

    expect(service.setDiffs).toHaveBeenCalledWith(diffs)
  })

  it('loadDiff (staged=true) で getDiffStagedUseCase.invoke が呼ばれる', async () => {
    const diffs = [createFileDiff()]
    vi.mocked(getDiffStagedUseCase.invoke).mockResolvedValue(diffs)

    vm.loadDiff('/repo', 'src/index.ts', true)

    expect(getDiffStagedUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      filePath: 'src/index.ts',
    })
    expect(getDiffUseCase.invoke).not.toHaveBeenCalled()

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.diffs$)
      expect(result).toEqual(diffs)
    })
  })

  it('loadCommitDiff で getDiffCommitUseCase.invoke が呼ばれる', async () => {
    const diffs = [createFileDiff()]
    vi.mocked(getDiffCommitUseCase.invoke).mockResolvedValue(diffs)

    vm.loadCommitDiff('/repo', 'abc1234', 'src/index.ts')

    expect(getDiffCommitUseCase.invoke).toHaveBeenCalledWith({
      worktreePath: '/repo',
      hash: 'abc1234',
      filePath: 'src/index.ts',
    })

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.diffs$)
      expect(result).toEqual(diffs)
    })

    expect(service.setDiffs).toHaveBeenCalledWith(diffs)
  })

  it('setDisplayMode で displayMode$ が更新される', async () => {
    vm.setDisplayMode('split')

    const mode = await firstValueFrom(vm.displayMode$)
    expect(mode).toBe('split')
    expect(service.setDiffDisplayMode).toHaveBeenCalledWith('split')
  })
})
