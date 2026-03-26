import type { MainProcessConfig } from '@/lib/main-process'
import type { AppStore, StoreSchema } from './infrastructure/main/store-schema'
import Store from 'electron-store'
import { registerIPCHandlers } from './infrastructure/main/ipc-handlers'
import { RepositoryMainService } from './infrastructure/main/repository-main-service'
import { SettingsMainService } from './infrastructure/main/settings-main-service'
import { storeDefaults } from './infrastructure/main/store-schema'

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
