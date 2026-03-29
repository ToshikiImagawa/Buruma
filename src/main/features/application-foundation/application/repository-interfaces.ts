import type { AppSettings, RecentRepository } from '@shared/domain'

/** electron-store のリポジトリ CRUD インターフェース */
export interface IStoreRepository {
  getRecentRepositories(): RecentRepository[]
  setRecentRepositories(repos: RecentRepository[]): void
  getSettings(): AppSettings
  setSettings(settings: AppSettings): void
}

/** Git リポジトリ検証リポジトリインターフェース */
export interface IGitValidationRepository {
  isGitRepository(dirPath: string): Promise<boolean>
}

/** Electron ダイアログリポジトリインターフェース */
export interface IDialogRepository {
  showOpenDirectoryDialog(): Promise<string | null>
}
