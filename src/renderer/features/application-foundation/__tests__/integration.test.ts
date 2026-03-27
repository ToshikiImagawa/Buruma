import type { AppSettings, RecentRepository, RepositoryInfo } from '@shared/domain'
import type { VContainer } from '@shared/lib/di'
import type { RepositoryRepository, SettingsRepository } from '../di-tokens'
import { DEFAULT_SETTINGS } from '@shared/domain'
import { createContainer } from '@shared/lib/di'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applicationFoundationConfig } from '../di-config'
import {
  DismissErrorUseCaseToken,
  ErrorNotificationServiceToken,
  ErrorNotificationViewModelToken,
  GetErrorNotificationsUseCaseToken,
  GetRecentRepositoriesUseCaseToken,
  GetSettingsUseCaseToken,
  OpenRepositoryUseCaseToken,
  RepositoryRepositoryToken,
  RepositorySelectorViewModelToken,
  RepositoryServiceToken,
  SettingsRepositoryToken,
  SettingsServiceToken,
  SettingsViewModelToken,
  UpdateSettingsUseCaseToken,
} from '../di-tokens'

function createMockRepositoryRepository(): RepositoryRepository {
  return {
    open: vi.fn<[], Promise<RepositoryInfo | null>>().mockResolvedValue({
      path: '/test/repo',
      name: 'repo',
      isValid: true,
    }),
    openByPath: vi.fn<[string], Promise<RepositoryInfo | null>>().mockResolvedValue({
      path: '/test/repo',
      name: 'repo',
      isValid: true,
    }),
    validate: vi.fn<[string], Promise<boolean>>().mockResolvedValue(true),
    getRecent: vi
      .fn<[], Promise<RecentRepository[]>>()
      .mockResolvedValue([{ path: '/recent/repo', name: 'recent', lastAccessed: '2026-01-01', pinned: false }]),
    removeRecent: vi.fn<[string], Promise<void>>().mockResolvedValue(undefined),
    pin: vi.fn<[string, boolean], Promise<void>>().mockResolvedValue(undefined),
  }
}

function createMockSettingsRepository(): SettingsRepository {
  return {
    get: vi.fn<[], Promise<AppSettings>>().mockResolvedValue({ ...DEFAULT_SETTINGS, theme: 'dark' }),
    update: vi.fn<[Partial<AppSettings>], Promise<void>>().mockResolvedValue(undefined),
    getTheme: vi.fn().mockResolvedValue('dark'),
    setTheme: vi.fn().mockResolvedValue(undefined),
  }
}

describe('application-foundation 結合テスト', () => {
  let container: VContainer
  let mockRepoRepo: RepositoryRepository
  let mockSettingsRepo: SettingsRepository

  beforeEach(async () => {
    container = createContainer()
    mockRepoRepo = createMockRepositoryRepository()
    mockSettingsRepo = createMockSettingsRepository()

    // register を実行
    applicationFoundationConfig.register!(container)

    // モック Repository で上書き
    container.register({ token: RepositoryRepositoryToken, useValue: mockRepoRepo, lifetime: 'singleton' })
    container.register({ token: SettingsRepositoryToken, useValue: mockSettingsRepo, lifetime: 'singleton' })

    // setUp を実行
    const tearDown = await applicationFoundationConfig.setUp!(container)
    // tearDown は不要（テスト終了時に GC される）
    void tearDown
  })

  it('DI コンテナから全サービスが解決できる', () => {
    expect(container.resolve(RepositoryServiceToken)).toBeDefined()
    expect(container.resolve(SettingsServiceToken)).toBeDefined()
    expect(container.resolve(ErrorNotificationServiceToken)).toBeDefined()
    expect(container.resolve(OpenRepositoryUseCaseToken)).toBeDefined()
    expect(container.resolve(GetRecentRepositoriesUseCaseToken)).toBeDefined()
    expect(container.resolve(GetSettingsUseCaseToken)).toBeDefined()
    expect(container.resolve(UpdateSettingsUseCaseToken)).toBeDefined()
    expect(container.resolve(GetErrorNotificationsUseCaseToken)).toBeDefined()
    expect(container.resolve(DismissErrorUseCaseToken)).toBeDefined()
  })

  it('ViewModel が transient で解決される（毎回新しいインスタンス）', () => {
    const vm1 = container.resolve(RepositorySelectorViewModelToken)
    const vm2 = container.resolve(RepositorySelectorViewModelToken)
    expect(vm1).not.toBe(vm2)
  })

  it('setUp で初期データがロードされる', () => {
    const settingsService = container.resolve(SettingsServiceToken)
    const repoService = container.resolve(RepositoryServiceToken)

    // settings$ に setUp でロードされた値が流れる
    let currentSettings: AppSettings | undefined
    settingsService.settings$.subscribe((s) => (currentSettings = s))
    expect(currentSettings?.theme).toBe('dark')

    // recentRepositories$ に setUp でロードされた値が流れる
    let recent: RecentRepository[] = []
    repoService.recentRepositories$.subscribe((r) => (recent = r))
    expect(recent).toHaveLength(1)
    expect(recent[0].path).toBe('/recent/repo')
  })

  it('リポジトリオープン → Service 更新フロー', async () => {
    const vm = container.resolve(RepositorySelectorViewModelToken)
    let currentRepo: RepositoryInfo | null = null
    vm.currentRepository$.subscribe((r) => (currentRepo = r))

    vm.openWithDialog()
    // 非同期処理の完了を待つ
    await vi.waitFor(() => {
      expect(currentRepo).not.toBeNull()
    })
    expect(currentRepo!.path).toBe('/test/repo')
  })

  it('設定更新フロー', async () => {
    const vm = container.resolve(SettingsViewModelToken)
    let settings: AppSettings = DEFAULT_SETTINGS
    vm.settings$.subscribe((s) => (settings = s))

    // setUp で dark にされている
    expect(settings.theme).toBe('dark')

    // setTheme で light に変更
    vm.setTheme('light')
    await vi.waitFor(() => {
      expect(mockSettingsRepo.update).toHaveBeenCalledWith({ theme: 'light' })
    })
  })

  it('エラー通知の追加・削除フロー', () => {
    const errorService = container.resolve(ErrorNotificationServiceToken)
    const vm = container.resolve(ErrorNotificationViewModelToken)
    let notifications: unknown[] = []
    vm.notifications$.subscribe((n) => (notifications = n))

    errorService.addNotification({
      id: 'err-1',
      message: 'test error',
      severity: 'error',
      timestamp: '2026-01-01T00:00:00Z',
    })
    expect(notifications).toHaveLength(1)

    vm.dismiss('err-1')
    expect(notifications).toHaveLength(0)
  })
})
