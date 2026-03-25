import type {
  GetRecentRepositoriesUseCase,
  IRepositoryService,
  OpenRepositoryByPathUseCase,
  OpenRepositoryUseCase,
  PinRepositoryUseCase,
  RemoveRecentRepositoryUseCase,
} from '../../di-tokens'
import type { RecentRepository, RepositoryInfo } from '../../domain'
import { BehaviorSubject } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { RepositorySelectorViewModel } from '../repository-selector-viewmodel'

function createMocks() {
  const recentSubject = new BehaviorSubject<RecentRepository[]>([])
  const currentRepoSubject = new BehaviorSubject<RepositoryInfo | null>(null)

  const openRepoUseCase: OpenRepositoryUseCase = { invoke: vi.fn() }
  const openByPathUseCase: OpenRepositoryByPathUseCase = { invoke: vi.fn() }
  const getRecentUseCase: GetRecentRepositoriesUseCase = { store: recentSubject.asObservable() }
  const removeRecentUseCase: RemoveRecentRepositoryUseCase = { invoke: vi.fn() }
  const pinUseCase: PinRepositoryUseCase = { invoke: vi.fn() }
  const repositoryService: IRepositoryService = {
    currentRepository$: currentRepoSubject.asObservable(),
    recentRepositories$: recentSubject.asObservable(),
    setCurrentRepository: vi.fn(),
    updateRecentRepositories: vi.fn(),
  }

  const vm = new RepositorySelectorViewModel(
    openRepoUseCase,
    openByPathUseCase,
    getRecentUseCase,
    removeRecentUseCase,
    pinUseCase,
    repositoryService,
  )

  return { vm, openRepoUseCase, openByPathUseCase, removeRecentUseCase, pinUseCase, recentSubject, currentRepoSubject }
}

describe('RepositorySelectorViewModel', () => {
  it('recentRepositories$ が UseCase の store を返す', () => {
    const { vm, recentSubject } = createMocks()
    const values: RecentRepository[][] = []
    vm.recentRepositories$.subscribe((v) => values.push(v))

    recentSubject.next([{ path: '/repo', name: 'repo', lastAccessed: '2026-01-01', pinned: false }])

    expect(values).toHaveLength(2)
    expect(values[1]).toHaveLength(1)
    expect(values[1][0].path).toBe('/repo')
  })

  it('currentRepository$ が Service の Observable を返す', () => {
    const { vm, currentRepoSubject } = createMocks()
    const values: (RepositoryInfo | null)[] = []
    vm.currentRepository$.subscribe((v) => values.push(v))

    const repo: RepositoryInfo = { path: '/test', name: 'test', isValid: true }
    currentRepoSubject.next(repo)

    expect(values).toHaveLength(2)
    expect(values[1]).toEqual(repo)
  })

  it('openWithDialog が UseCase を呼ぶ', () => {
    const { vm, openRepoUseCase } = createMocks()
    vm.openWithDialog()
    expect(openRepoUseCase.invoke).toHaveBeenCalledOnce()
  })

  it('openByPath が UseCase を呼ぶ', () => {
    const { vm, openByPathUseCase } = createMocks()
    vm.openByPath('/some/path')
    expect(openByPathUseCase.invoke).toHaveBeenCalledWith('/some/path')
  })

  it('removeRecent が UseCase を呼ぶ', () => {
    const { vm, removeRecentUseCase } = createMocks()
    vm.removeRecent('/old/repo')
    expect(removeRecentUseCase.invoke).toHaveBeenCalledWith('/old/repo')
  })

  it('pin が UseCase を呼ぶ', () => {
    const { vm, pinUseCase } = createMocks()
    vm.pin('/repo', true)
    expect(pinUseCase.invoke).toHaveBeenCalledWith({ path: '/repo', pinned: true })
  })
})
