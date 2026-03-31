import type { RecentRepository, RepositoryInfo } from '@shared/domain'
import type { StoreRepository } from '../repositories/types'

const MAX_RECENT = 20

export function addToRecent(store: StoreRepository, repo: RepositoryInfo): void {
  const recent = store.getRecentRepositories()
  const filtered = recent.filter((r: RecentRepository) => r.path !== repo.path)
  const entry: RecentRepository = {
    path: repo.path,
    name: repo.name,
    lastAccessed: new Date().toISOString(),
    pinned: recent.find((r: RecentRepository) => r.path === repo.path)?.pinned ?? false,
  }
  const updated = [entry, ...filtered].slice(0, MAX_RECENT)
  store.setRecentRepositories(updated)
}
