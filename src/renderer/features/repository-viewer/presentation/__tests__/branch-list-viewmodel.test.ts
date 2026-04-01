import type { BranchList } from '@shared/domain'
import type { RepositoryViewerService } from '../../application/services/repository-viewer-service-interface'
import type { GetBranchesUseCase } from '../../di-tokens'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BranchListDefaultViewModel } from '../branch-list-viewmodel'

function createMockGetBranchesUseCase(): GetBranchesUseCase {
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
    diffDisplayMode$: new BehaviorSubject<'inline' | 'split'>('inline'),
    logSearch$: new BehaviorSubject(''),
    branchSearch$: new BehaviorSubject(''),
  }
}

function createBranchList(): BranchList {
  return {
    current: 'main',
    local: ['main', 'feature/test'],
    remote: ['origin/main'],
  }
}

describe('BranchListDefaultViewModel', () => {
  let useCase: ReturnType<typeof createMockGetBranchesUseCase>
  let service: ReturnType<typeof createMockService>
  let vm: BranchListDefaultViewModel

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = createMockGetBranchesUseCase()
    service = createMockService()
    vm = new BranchListDefaultViewModel(useCase, service)
  })

  it('初期値は branches$ が null', async () => {
    const branches = await firstValueFrom(vm.branches$)
    expect(branches).toBeNull()
  })

  it('loadBranches で UseCase.invoke が呼ばれる', async () => {
    const branchList = createBranchList()
    vi.mocked(useCase.invoke).mockResolvedValue(branchList)

    vm.loadBranches('/repo')

    expect(useCase.invoke).toHaveBeenCalledWith('/repo')

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.branches$)
      expect(result).toEqual(branchList)
    })
  })

  it('setSearch で service.setBranchSearch が呼ばれる', () => {
    vm.setSearch('feature')

    expect(service.setBranchSearch).toHaveBeenCalledWith('feature')
  })
})
