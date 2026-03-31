import type { AppSettings, RecentRepository } from '@shared/domain'

/** electron-store のリポジトリ CRUD インターフェース */
export interface StoreRepository {
  getRecentRepositories(): RecentRepository[]
  setRecentRepositories(repos: RecentRepository[]): void
  getSettings(): AppSettings
  setSettings(settings: AppSettings): void
}

/** Git リポジトリ検証リポジトリインターフェース */
export interface GitValidationRepository {
  isGitRepository(dirPath: string): Promise<boolean>
}

/** Electron ダイアログリポジトリインターフェース */
export interface DialogRepository {
  showOpenDirectoryDialog(): Promise<string | null>
}
