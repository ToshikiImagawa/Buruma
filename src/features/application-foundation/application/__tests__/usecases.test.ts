import type { AppSettings, ErrorNotification, RecentRepository, RepositoryInfo } from '@domain'
import type {
  ErrorNotificationService,
  RepositoryRepository,
  RepositoryService,
  SettingsRepository,
  SettingsService,
} from '../../di-tokens'
import { DEFAULT_SETTINGS } from '@domain'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { DismissErrorDefaultUseCase } from '../usecases/dismiss-error-usecase'
import { GetErrorNotificationsDefaultUseCase } from '../usecases/get-error-notifications-usecase'
import { GetRecentRepositoriesDefaultUseCase } from '../usecases/get-recent-repositories-usecase'
import { GetSettingsDefaultUseCase } from '../usecases/get-settings-usecase'
import { OpenRepositoryByPathDefaultUseCase } from '../usecases/open-repository-by-path-usecase'
import { OpenRepositoryDefaultUseCase } from '../usecases/open-repository-usecase'
import { PinRepositoryDefaultUseCase } from '../usecases/pin-repository-usecase'
import { RemoveRecentRepositoryDefaultUseCase } from '../usecases/remove-recent-repository-usecase'
import { RetryErrorDefaultUseCase } from '../usecases/retry-error-usecase'
import { UpdateSettingsDefaultUseCase } from '../usecases/update-settings-usecase'

// --- Mock factories ---

function createMockRepositoryRepo(overrides: Partial<RepositoryRepository> = {}): RepositoryRepository {
  return {
    open: vi.fn().mockResolvedValue(null),
    openByPath: vi.fn().mockResolvedValue(null),
    validate: vi.fn().mockResolvedValue(true),
    getRecent: vi.fn().mockResolvedValue([]),
    removeRecent: vi.fn().mockResolvedValue(undefined),
    pin: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function createMockRepoService(): RepositoryService {
  const currentRepo$ = new BehaviorSubject<RepositoryInfo | null>(null)
  const recentRepos$ = new BehaviorSubject<RecentRepository[]>([])
  return {
    currentRepository$: currentRepo$.asObservable(),
    recentRepositories$: recentRepos$.asObservable(),
    setCurrentRepository: vi.fn((repo) => currentRepo$.next(repo)),
    updateRecentRepositories: vi.fn((repos) => recentRepos$.next(repos)),
  }
}

function createMockSettingsService(): SettingsService {
  const settings$ = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS)
  return {
    settings$: settings$.asObservable(),
    updateSettings: vi.fn((s) => settings$.next({ ...settings$.getValue(), ...s })),
    replaceSettings: vi.fn((s) => settings$.next(s)),
  }
}

function createMockSettingsRepo(): SettingsRepository {
  return {
    get: vi.fn().mockResolvedValue(DEFAULT_SETTINGS),
    update: vi.fn().mockResolvedValue(undefined),
    getTheme: vi.fn().mockResolvedValue('system'),
    setTheme: vi.fn().mockResolvedValue(undefined),
  }
}

function createMockErrorService(): ErrorNotificationService {
  const notifications$ = new BehaviorSubject<ErrorNotification[]>([])
  return {
    notifications$: notifications$.asObservable(),
    addNotification: vi.fn((n) => notifications$.next([...notifications$.getValue(), n])),
    removeNotification: vi.fn((id) => notifications$.next(notifications$.getValue().filter((n) => n.id !== id))),
    clear: vi.fn(() => notifications$.next([])),
  }
}

// --- Tests ---

describe('GetRecentRepositoriesUseCase', () => {
  it('service の recentRepositories$ を公開する', async () => {
    const service = createMockRepoService()
    const useCase = new GetRecentRepositoriesDefaultUseCase(service)
    const value = await firstValueFrom(useCase.store)
    expect(value).toEqual([])
  })
})

describe('OpenRepositoryUseCase', () => {
  it('正常系: repo.open → service に反映', async () => {
    const repoInfo: RepositoryInfo = { path: '/test', name: 'test', isValid: true }
    const recent: RecentRepository[] = [{ path: '/test', name: 'test', lastAccessed: '2026-01-01', pinned: false }]
    const repo = createMockRepositoryRepo({
      open: vi.fn().mockResolvedValue(repoInfo),
      getRecent: vi.fn().mockResolvedValue(recent),
    })
    const service = createMockRepoService()
    const errorService = createMockErrorService()
    const useCase = new OpenRepositoryDefaultUseCase(repo, service, errorService)

    useCase.invoke()
    await vi.waitFor(() => {
      expect(service.setCurrentRepository).toHaveBeenCalledWith(repoInfo)
    })
    await vi.waitFor(() => {
      expect(service.updateRecentRepositories).toHaveBeenCalledWith(recent)
    })
  })

  it('エラー時: errorService に通知が追加される', async () => {
    const repo = createMockRepositoryRepo({
      open: vi.fn().mockRejectedValue(new Error('test error')),
    })
    const service = createMockRepoService()
    const errorService = createMockErrorService()
    const useCase = new OpenRepositoryDefaultUseCase(repo, service, errorService)

    useCase.invoke()
    await vi.waitFor(() => {
      expect(errorService.addNotification).toHaveBeenCalled()
    })
  })
})

describe('OpenRepositoryByPathUseCase', () => {
  it('正常系: repo.openByPath → service に反映', async () => {
    const repoInfo: RepositoryInfo = { path: '/test', name: 'test', isValid: true }
    const repo = createMockRepositoryRepo({
      openByPath: vi.fn().mockResolvedValue(repoInfo),
      getRecent: vi.fn().mockResolvedValue([]),
    })
    const service = createMockRepoService()
    const errorService = createMockErrorService()
    const useCase = new OpenRepositoryByPathDefaultUseCase(repo, service, errorService)

    useCase.invoke('/test')
    await vi.waitFor(() => {
      expect(service.setCurrentRepository).toHaveBeenCalledWith(repoInfo)
    })
  })
})

describe('RemoveRecentRepositoryUseCase', () => {
  it('repo.removeRecent → service に更新を反映', async () => {
    const repo = createMockRepositoryRepo({
      removeRecent: vi.fn().mockResolvedValue(undefined),
      getRecent: vi.fn().mockResolvedValue([]),
    })
    const service = createMockRepoService()
    const useCase = new RemoveRecentRepositoryDefaultUseCase(repo, service)

    useCase.invoke('/test')
    await vi.waitFor(() => {
      expect(repo.removeRecent).toHaveBeenCalledWith('/test')
      expect(service.updateRecentRepositories).toHaveBeenCalledWith([])
    })
  })
})

describe('PinRepositoryUseCase', () => {
  it('repo.pin → service に更新を反映', async () => {
    const repo = createMockRepositoryRepo({
      pin: vi.fn().mockResolvedValue(undefined),
      getRecent: vi.fn().mockResolvedValue([]),
    })
    const service = createMockRepoService()
    const useCase = new PinRepositoryDefaultUseCase(repo, service)

    useCase.invoke({ path: '/test', pinned: true })
    await vi.waitFor(() => {
      expect(repo.pin).toHaveBeenCalledWith('/test', true)
    })
  })
})

describe('GetSettingsUseCase', () => {
  it('service の settings$ を ReactiveProperty として公開する', async () => {
    const service = createMockSettingsService()
    const useCase = new GetSettingsDefaultUseCase(service)
    expect(useCase.property.value).toEqual(DEFAULT_SETTINGS)
  })
})

describe('UpdateSettingsUseCase', () => {
  it('repo.update → service に反映', async () => {
    const repo = createMockSettingsRepo()
    const service = createMockSettingsService()
    const useCase = new UpdateSettingsDefaultUseCase(repo, service)

    useCase.invoke({ theme: 'dark' })
    await vi.waitFor(() => {
      expect(repo.update).toHaveBeenCalledWith({ theme: 'dark' })
      expect(service.updateSettings).toHaveBeenCalledWith({ theme: 'dark' })
    })
  })
})

describe('GetErrorNotificationsUseCase', () => {
  it('service の notifications$ を公開する', async () => {
    const service = createMockErrorService()
    const useCase = new GetErrorNotificationsDefaultUseCase(service)
    const value = await firstValueFrom(useCase.store)
    expect(value).toEqual([])
  })
})

describe('DismissErrorUseCase', () => {
  it('service.removeNotification を呼ぶ', () => {
    const service = createMockErrorService()
    const useCase = new DismissErrorDefaultUseCase(service)
    useCase.invoke('error-1')
    expect(service.removeNotification).toHaveBeenCalledWith('error-1')
  })
})

describe('RetryErrorUseCase', () => {
  it('service.removeNotification を呼ぶ', () => {
    const service = createMockErrorService()
    const useCase = new RetryErrorDefaultUseCase(service)
    useCase.invoke('error-1')
    expect(service.removeNotification).toHaveBeenCalledWith('error-1')
  })
})
