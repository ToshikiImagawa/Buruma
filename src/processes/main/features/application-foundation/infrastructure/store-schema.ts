import type { AppSettings, RecentRepository } from '@domain'
import { DEFAULT_SETTINGS } from '@domain'

export interface StoreSchema {
  recentRepositories: RecentRepository[]
  settings: AppSettings
}

export const storeDefaults: StoreSchema = {
  recentRepositories: [],
  settings: DEFAULT_SETTINGS,
}

/** electron-store / conf の get/set を抽象化したインターフェース */
export interface AppStore {
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K]
  get<K extends keyof StoreSchema>(key: K, defaultValue: StoreSchema[K]): StoreSchema[K]
  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void
}
