import type { FileTreeNode } from '@shared/domain'
import type { RepositoryViewerService } from '../../application/services/repository-viewer-service-interface'
import type { GetFileTreeUseCase } from '../../di-tokens'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FileTreeDefaultViewModel } from '../file-tree-viewmodel'

function createMockGetFileTreeUseCase(): GetFileTreeUseCase {
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

function createFileTreeNode(): FileTreeNode {
  return {
    name: 'root',
    path: '.',
    type: 'directory',
    children: [{ name: 'index.ts', path: 'index.ts', type: 'file', children: [] }],
  }
}

describe('FileTreeDefaultViewModel', () => {
  let useCase: ReturnType<typeof createMockGetFileTreeUseCase>
  let service: ReturnType<typeof createMockService>
  let vm: FileTreeDefaultViewModel

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = createMockGetFileTreeUseCase()
    service = createMockService()
    vm = new FileTreeDefaultViewModel(useCase, service)
  })

  it('初期値は tree$ が null', async () => {
    const tree = await firstValueFrom(vm.tree$)
    expect(tree).toBeNull()
  })

  it('loadTree で UseCase.invoke が呼ばれる', async () => {
    const treeNode = createFileTreeNode()
    vi.mocked(useCase.invoke).mockResolvedValue(treeNode)

    vm.loadTree('/repo')

    expect(useCase.invoke).toHaveBeenCalledWith('/repo')

    await vi.waitFor(async () => {
      const result = await firstValueFrom(vm.tree$)
      expect(result).toEqual(treeNode)
    })
  })

  it('selectFile で service.selectFile が呼ばれる', () => {
    vm.selectFile('src/index.ts')

    expect(service.selectFile).toHaveBeenCalledWith('src/index.ts', false)
  })
})
