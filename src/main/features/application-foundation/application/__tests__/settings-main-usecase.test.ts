import type { AppSettings } from '@shared/domain'
import type { IStoreRepository } from '../repository-interfaces'
import { DEFAULT_SETTINGS } from '@shared/domain'
import { describe, expect, it, vi } from 'vitest'
import { SettingsMainUseCase } from '../settings-main-usecase'

function createMockStore(overrides: Partial<IStoreRepository> = {}): IStoreRepository {
  return {
    getRecentRepositories: vi.fn().mockReturnValue([]),
    setRecentRepositories: vi.fn(),
    getSettings: vi.fn().mockReturnValue(DEFAULT_SETTINGS),
    setSettings: vi.fn(),
    ...overrides,
  }
}

describe('SettingsMainUseCase', () => {
  describe('getAll', () => {
    it('ストアから全設定を返す', () => {
      const settings: AppSettings = { theme: 'dark', gitPath: '/usr/bin/git', defaultWorkDir: '/home' }
      const store = createMockStore({ getSettings: vi.fn().mockReturnValue(settings) })
      const useCase = new SettingsMainUseCase(store)

      expect(useCase.getAll()).toEqual(settings)
    })
  })

  describe('update', () => {
    it('部分的な設定を既存の設定にマージして保存する', () => {
      const current: AppSettings = { theme: 'system', gitPath: null, defaultWorkDir: null }
      const store = createMockStore({ getSettings: vi.fn().mockReturnValue(current) })
      const useCase = new SettingsMainUseCase(store)

      useCase.update({ gitPath: '/usr/local/bin/git' })
      expect(store.setSettings).toHaveBeenCalledWith({
        theme: 'system',
        gitPath: '/usr/local/bin/git',
        defaultWorkDir: null,
      })
    })

    it('複数フィールドを同時に更新できる', () => {
      const store = createMockStore({ getSettings: vi.fn().mockReturnValue(DEFAULT_SETTINGS) })
      const useCase = new SettingsMainUseCase(store)

      useCase.update({ theme: 'dark', defaultWorkDir: '/workspace' })
      expect(store.setSettings).toHaveBeenCalledWith({
        theme: 'dark',
        gitPath: null,
        defaultWorkDir: '/workspace',
      })
    })
  })

  describe('getTheme', () => {
    it('現在のテーマを返す', () => {
      const settings: AppSettings = { theme: 'dark', gitPath: null, defaultWorkDir: null }
      const store = createMockStore({ getSettings: vi.fn().mockReturnValue(settings) })
      const useCase = new SettingsMainUseCase(store)

      expect(useCase.getTheme()).toBe('dark')
    })
  })

  describe('setTheme', () => {
    it('テーマを変更し他の設定を保持する', () => {
      const current: AppSettings = { theme: 'system', gitPath: '/usr/bin/git', defaultWorkDir: '/home' }
      const store = createMockStore({ getSettings: vi.fn().mockReturnValue(current) })
      const useCase = new SettingsMainUseCase(store)

      useCase.setTheme('light')
      expect(store.setSettings).toHaveBeenCalledWith({
        theme: 'light',
        gitPath: '/usr/bin/git',
        defaultWorkDir: '/home',
      })
    })
  })
})
