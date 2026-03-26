import type { MainProcessConfig } from '@/shared/lib/main-process'
import type { AppStore, StoreSchema } from './infrastructure/store-schema'
import Store from 'electron-store'
import { registerIPCHandlers } from './infrastructure/ipc-handlers'
import { RepositoryMainService } from './infrastructure/repository-main-service'
import { SettingsMainService } from './infrastructure/settings-main-service'
import { storeDefaults } from './infrastructure/store-schema'

export const applicationFoundationMainConfig: MainProcessConfig = {
  initialize() {
    const store = new Store<StoreSchema>({
      defaults: storeDefaults,
    }) as unknown as AppStore

    const repositoryMainService = new RepositoryMainService(store)
    const settingsMainService = new SettingsMainService(store)

    registerIPCHandlers(repositoryMainService, settingsMainService)
  },
  dispose() {
    // 将来的に ipcMain.removeHandler() を呼ぶ場合はここに追加
  },
}
