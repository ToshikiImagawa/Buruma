import type { RecentRepository } from '@shared/domain'
import type { IDialogRepository, IGitValidationRepository, IStoreRepository } from '../repository-interfaces'
import { DEFAULT_SETTINGS } from '@shared/domain'
import { describe, expect, it, vi } from 'vitest'
import { GetRecentRepositoriesMainUseCase } from '../usecases/get-recent-repositories-main-usecase'
import { OpenRepositoryByPathMainUseCase } from '../usecases/open-repository-by-path-main-usecase'
import { OpenRepositoryWithDialogMainUseCase } from '../usecases/open-repository-with-dialog-main-usecase'
import { PinRepositoryMainUseCase } from '../usecases/pin-repository-main-usecase'
import { RemoveRecentRepositoryMainUseCase } from '../usecases/remove-recent-repository-main-usecase'
import { ValidateRepositoryMainUseCase } from '../usecases/validate-repository-main-usecase'

function createMockStore(overrides: Partial<IStoreRepository> = {}): IStoreRepository {
  return {
    getRecentRepositories: vi.fn().mockReturnValue([]),
    setRecentRepositories: vi.fn(),
    getSettings: vi.fn().mockReturnValue(DEFAULT_SETTINGS),
    setSettings: vi.fn(),
    ...overrides,
  }
}

function createMockGitValidator(overrides: Partial<IGitValidationRepository> = {}): IGitValidationRepository {
  return {
    isGitRepository: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

function createMockDialogRepository(overrides: Partial<IDialogRepository> = {}): IDialogRepository {
  return {
    showOpenDirectoryDialog: vi.fn().mockResolvedValue(null),
    ...overrides,
  }
}

describe('OpenRepositoryWithDialogMainUseCase', () => {
  it('ダイアログキャンセル時に null を返す', async () => {
    const useCase = new OpenRepositoryWithDialogMainUseCase(
      createMockStore(),
      createMockGitValidator(),
      createMockDialogRepository({ showOpenDirectoryDialog: vi.fn().mockResolvedValue(null) }),
    )
    expect(await useCase.invoke()).toBeNull()
  })

  it('有効な Git リポジトリを選択した場合に RepositoryInfo を返す', async () => {
    const useCase = new OpenRepositoryWithDialogMainUseCase(
      createMockStore(),
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(true) }),
      createMockDialogRepository({ showOpenDirectoryDialog: vi.fn().mockResolvedValue('/path/to/repo') }),
    )
    expect(await useCase.invoke()).toEqual({ path: '/path/to/repo', name: 'repo', isValid: true })
  })

  it('無効なフォルダを選択した場合に null を返す', async () => {
    const useCase = new OpenRepositoryWithDialogMainUseCase(
      createMockStore(),
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(false) }),
      createMockDialogRepository({ showOpenDirectoryDialog: vi.fn().mockResolvedValue('/path/to/not-a-repo') }),
    )
    expect(await useCase.invoke()).toBeNull()
  })
})

describe('OpenRepositoryByPathMainUseCase', () => {
  it('有効な Git リポジトリの場合に RepositoryInfo を返し履歴に追加する', async () => {
    const store = createMockStore()
    const useCase = new OpenRepositoryByPathMainUseCase(
      store,
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(true) }),
    )
    const result = await useCase.invoke('/home/user/my-project')
    expect(result).toEqual({ path: '/home/user/my-project', name: 'my-project', isValid: true })
    expect(store.setRecentRepositories).toHaveBeenCalled()
  })

  it('無効なパスの場合に null を返す', async () => {
    const useCase = new OpenRepositoryByPathMainUseCase(
      createMockStore(),
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(false) }),
    )
    expect(await useCase.invoke('/invalid')).toBeNull()
  })

  it('パスからリポジトリ名を正しく抽出する', async () => {
    const useCase = new OpenRepositoryByPathMainUseCase(
      createMockStore(),
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(true) }),
    )
    const result = await useCase.invoke('/a/b/c/my-repo')
    expect(result?.name).toBe('my-repo')
  })
})

describe('ValidateRepositoryMainUseCase', () => {
  it('Git リポジトリの検証結果を返す', async () => {
    const gitValidator = createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(true) })
    const useCase = new ValidateRepositoryMainUseCase(gitValidator)
    expect(await useCase.invoke('/path')).toBe(true)
    expect(gitValidator.isGitRepository).toHaveBeenCalledWith('/path')
  })
})

describe('GetRecentRepositoriesMainUseCase', () => {
  it('ストアから最近のリポジトリ一覧を返す', () => {
    const repos: RecentRepository[] = [
      { path: '/a', name: 'a', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: false },
    ]
    const store = createMockStore({ getRecentRepositories: vi.fn().mockReturnValue(repos) })
    const useCase = new GetRecentRepositoriesMainUseCase(store)
    expect(useCase.invoke()).toEqual(repos)
  })
})

describe('RemoveRecentRepositoryMainUseCase', () => {
  it('指定パスのリポジトリを履歴から削除する', () => {
    const repos: RecentRepository[] = [
      { path: '/a', name: 'a', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: false },
      { path: '/b', name: 'b', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: false },
    ]
    const store = createMockStore({ getRecentRepositories: vi.fn().mockReturnValue(repos) })
    const useCase = new RemoveRecentRepositoryMainUseCase(store)
    useCase.invoke('/a')
    expect(store.setRecentRepositories).toHaveBeenCalledWith([repos[1]])
  })
})

describe('PinRepositoryMainUseCase', () => {
  it('リポジトリのピン留め状態を更新する', () => {
    const repos: RecentRepository[] = [
      { path: '/a', name: 'a', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: false },
    ]
    const store = createMockStore({ getRecentRepositories: vi.fn().mockReturnValue(repos) })
    const useCase = new PinRepositoryMainUseCase(store)
    useCase.invoke({ path: '/a', pinned: true })
    expect(store.setRecentRepositories).toHaveBeenCalledWith([
      { path: '/a', name: 'a', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: true },
    ])
  })
})

describe('addToRecent (履歴管理ロジック)', () => {
  it('重複するリポジトリは最新として先頭に移動する', async () => {
    const existing: RecentRepository[] = [
      { path: '/old', name: 'old', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: false },
      { path: '/target', name: 'target', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: false },
    ]
    const store = createMockStore({ getRecentRepositories: vi.fn().mockReturnValue(existing) })
    const useCase = new OpenRepositoryByPathMainUseCase(
      store,
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(true) }),
    )
    await useCase.invoke('/target')
    const savedRepos = (store.setRecentRepositories as ReturnType<typeof vi.fn>).mock.calls[0][0] as RecentRepository[]
    expect(savedRepos[0].path).toBe('/target')
    expect(savedRepos).toHaveLength(2)
  })

  it('ピン留め状態を保持する', async () => {
    const existing: RecentRepository[] = [
      { path: '/pinned', name: 'pinned', lastAccessed: '2026-01-01T00:00:00.000Z', pinned: true },
    ]
    const store = createMockStore({ getRecentRepositories: vi.fn().mockReturnValue(existing) })
    const useCase = new OpenRepositoryByPathMainUseCase(
      store,
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(true) }),
    )
    await useCase.invoke('/pinned')
    const savedRepos = (store.setRecentRepositories as ReturnType<typeof vi.fn>).mock.calls[0][0] as RecentRepository[]
    expect(savedRepos[0].pinned).toBe(true)
  })

  it('最大20件を超えた場合に古いエントリを切り捨てる', async () => {
    const existing: RecentRepository[] = Array.from({ length: 20 }, (_, i) => ({
      path: `/repo-${i}`,
      name: `repo-${i}`,
      lastAccessed: '2026-01-01T00:00:00.000Z',
      pinned: false,
    }))
    const store = createMockStore({ getRecentRepositories: vi.fn().mockReturnValue(existing) })
    const useCase = new OpenRepositoryByPathMainUseCase(
      store,
      createMockGitValidator({ isGitRepository: vi.fn().mockResolvedValue(true) }),
    )
    await useCase.invoke('/new-repo')
    const savedRepos = (store.setRecentRepositories as ReturnType<typeof vi.fn>).mock.calls[0][0] as RecentRepository[]
    expect(savedRepos).toHaveLength(20)
    expect(savedRepos[0].path).toBe('/new-repo')
  })
})
