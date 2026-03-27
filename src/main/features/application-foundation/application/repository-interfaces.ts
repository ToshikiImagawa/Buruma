import type { AppSettings, RecentRepository } from '@/shared/domain'

/** electron-store のリポジトリ CRUD インターフェース */
export interface IStoreRepository {
  getRecentRepositories(): RecentRepository[]
  setRecentRepositories(repos: RecentRepository[]): void
  getSettings(): AppSettings
  setSettings(settings: AppSettings): void
}

/** Git リポジトリ検証インターフェース */
export interface IGitRepositoryValidator {
  isGitRepository(dirPath: string): Promise<boolean>
}

/** Electron ダイアログインターフェース */
export interface IDialogService {
  showOpenDirectoryDialog(): Promise<string | null>
}
