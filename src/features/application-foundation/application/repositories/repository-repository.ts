import type { RecentRepository, RepositoryInfo } from '@domain'

export interface RepositoryRepository {
  open(): Promise<RepositoryInfo | null>
  openByPath(path: string): Promise<RepositoryInfo | null>
  validate(path: string): Promise<boolean>
  getRecent(): Promise<RecentRepository[]>
  removeRecent(path: string): Promise<void>
  pin(path: string, pinned: boolean): Promise<void>
}
