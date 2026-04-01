import type { GitStatus } from '@shared/domain'
import type { RepositoryViewerService } from '../../application/services/repository-viewer-service-interface'
import type { GetStatusUseCase } from '../../di-tokens'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StatusDefaultViewModel } from '../status-viewmodel'

function createMockGetStatusUseCase(): GetStatusUseCase {
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

function createGitStatus(overrides: Partial<GitStatus> = {}): GitStatus {
  return {
    current: 'main',
    tracking: 'origin/main',
    files: [],
    ahead: 0,
    behind: 0,
    ...overrides,
  }
}

describe('StatusDefaultViewModel', () => {
  let useCase: ReturnType<typeof createMockGetStatusUseCase>
  let service: ReturnType<typeof createMockService>
  let vm: StatusDefaultViewModel

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = createMockGetStatusUseCase()
    service = createMockService()
    vm = new StatusDefaultViewModel(useCase, service)
  })

  it('初期値は status$ が null, loading$ が false', async () => {
    const status = await firstValueFrom(vm.status$)
    const loading = await firstValueFrom(vm.loading$)

    expect(status).toBeNull()
    expect(loading).toBe(false)
  })

  it('loadStatus 呼び出しで UseCase.invoke が呼ばれる', async () => {
    const status = createGitStatus()
    vi.mocked(useCase.invoke).mockResolvedValue(status)

    vm.loadStatus('/repo')

    expect(useCase.invoke).toHaveBeenCalledWith('/repo')
  })

  it('loadStatus 成功で status$ にデータが流れる', async () => {
    const status = createGitStatus({ current: 'feature/test' })
    vi.mocked(useCase.invoke).mockResolvedValue(status)

    vm.loadStatus('/repo')
    // Promise が解決されるのを待つ
    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.status$)
      expect(result).toEqual(status)
    })

    const loading = await firstValueFrom(vm.loading$)
    expect(loading).toBe(false)
  })

  it('loadStatus 失敗で status$ が null のまま', async () => {
    vi.mocked(useCase.invoke).mockRejectedValue(new Error('git error'))

    vm.loadStatus('/repo')
    await vi.waitFor(async () => {
      const loading = await firstValueFrom(vm.loading$)
      expect(loading).toBe(false)
    })

    const status = await firstValueFrom(vm.status$)
    expect(status).toBeNull()
  })

  it('selectFile で service.selectFile が呼ばれる', () => {
    vm.selectFile('src/index.ts', true)

    expect(service.selectFile).toHaveBeenCalledWith('src/index.ts', true)
  })
})
