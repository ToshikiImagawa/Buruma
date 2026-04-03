import type { AppSettings, RecentRepository } from '@domain'
import type { StoreRepository } from '../../application/repositories/types'
import type { AppStore } from '../store-schema'

export class StoreDefaultRepository implements StoreRepository {
  constructor(private readonly store: AppStore) {}

  getRecentRepositories(): RecentRepository[] {
    return this.store.get('recentRepositories', [])
  }

  setRecentRepositories(repos: RecentRepository[]): void {
    this.store.set('recentRepositories', repos)
  }

  getSettings(): AppSettings {
    return this.store.get('settings')
  }

  setSettings(settings: AppSettings): void {
    this.store.set('settings', settings)
  }
}
