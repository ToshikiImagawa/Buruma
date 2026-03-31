import type { AppSettings, RecentRepository } from '@shared/domain'
import type { IStoreRepository } from '../../application/repositories/types'
import type { AppStore } from '../store-schema'

export class StoreRepository implements IStoreRepository {
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
