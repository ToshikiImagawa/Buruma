import type { AppSettings } from '@domain'
import type { StoreRepository } from '../repositories/types'
import { DEFAULT_SETTINGS } from '@domain'
import { describe, expect, it, vi } from 'vitest'
import { GetSettingsMainUseCase } from '../usecases/get-settings-main-usecase'
import { GetThemeMainUseCase } from '../usecases/get-theme-main-usecase'
import { SetThemeMainUseCase } from '../usecases/set-theme-main-usecase'
import { UpdateSettingsMainUseCase } from '../usecases/update-settings-main-usecase'

function createMockStore(overrides: Partial<StoreRepository> = {}): StoreRepository {
  return {
    getRecentRepositories: vi.fn().mockReturnValue([]),
    setRecentRepositories: vi.fn(),
    getSettings: vi.fn().mockReturnValue(DEFAULT_SETTINGS),
    setSettings: vi.fn(),
    ...overrides,
  }
}

describe('GetSettingsMainUseCase', () => {
  it('ストアから全設定を返す', () => {
    const settings: AppSettings = { theme: 'dark', gitPath: '/usr/bin/git', defaultWorkDir: '/home' }
    const store = createMockStore({ getSettings: vi.fn().mockReturnValue(settings) })
    const useCase = new GetSettingsMainUseCase(store)
    expect(useCase.invoke()).toEqual(settings)
  })
})

describe('UpdateSettingsMainUseCase', () => {
  it('部分的な設定を既存の設定にマージして保存する', () => {
    const current: AppSettings = { theme: 'system', gitPath: null, defaultWorkDir: null, commitMessageRules: null }
    const store = createMockStore({ getSettings: vi.fn().mockReturnValue(current) })
    const useCase = new UpdateSettingsMainUseCase(store)
    useCase.invoke({ gitPath: '/usr/local/bin/git' })
    expect(store.setSettings).toHaveBeenCalledWith({
      theme: 'system',
      gitPath: '/usr/local/bin/git',
      defaultWorkDir: null,
      commitMessageRules: null,
    })
  })

  it('複数フィールドを同時に更新できる', () => {
    const store = createMockStore({ getSettings: vi.fn().mockReturnValue(DEFAULT_SETTINGS) })
    const useCase = new UpdateSettingsMainUseCase(store)
    useCase.invoke({ theme: 'dark', defaultWorkDir: '/workspace' })
    expect(store.setSettings).toHaveBeenCalledWith({
      theme: 'dark',
      gitPath: null,
      defaultWorkDir: '/workspace',
      commitMessageRules: null,
    })
  })
})

describe('GetThemeMainUseCase', () => {
  it('現在のテーマを返す', () => {
    const settings: AppSettings = { theme: 'dark', gitPath: null, defaultWorkDir: null, commitMessageRules: null }
    const store = createMockStore({ getSettings: vi.fn().mockReturnValue(settings) })
    const useCase = new GetThemeMainUseCase(store)
    expect(useCase.invoke()).toBe('dark')
  })
})

describe('SetThemeMainUseCase', () => {
  it('テーマを変更し他の設定を保持する', () => {
    const current: AppSettings = { theme: 'system', gitPath: '/usr/bin/git', defaultWorkDir: '/home' }
    const store = createMockStore({ getSettings: vi.fn().mockReturnValue(current) })
    const useCase = new SetThemeMainUseCase(store)
    useCase.invoke('light')
    expect(store.setSettings).toHaveBeenCalledWith({
      theme: 'light',
      gitPath: '/usr/bin/git',
      defaultWorkDir: '/home',
    })
  })
})
