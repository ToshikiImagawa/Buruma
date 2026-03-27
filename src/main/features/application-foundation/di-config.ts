import type { VContainerConfig } from '@shared/lib/di'
import type { AppStore, StoreSchema } from './infrastructure/store-schema'
import Store from 'electron-store'
import { RepositoryMainUseCase } from './application/repository-main-usecase'
import { SettingsMainUseCase } from './application/settings-main-usecase'
import {
  DialogServiceToken,
  GitRepositoryValidatorToken,
  RepositoryMainUseCaseToken,
  SettingsMainUseCaseToken,
  StoreRepositoryToken,
} from './di-tokens'
import { DialogService } from './infrastructure/dialog-service'
import { GitRepositoryValidator } from './infrastructure/git-repository-validator'
import { StoreRepository } from './infrastructure/store-repository'
import { storeDefaults } from './infrastructure/store-schema'
import { registerIPCHandlers } from './presentation/ipc-handlers'

export const applicationFoundationMainConfig: VContainerConfig = {
  register(container) {
    // Infrastructure
    const store = new Store<StoreSchema>({
      defaults: storeDefaults,
    }) as unknown as AppStore

    container.registerSingleton(StoreRepositoryToken, () => new StoreRepository(store))
    container.registerSingleton(GitRepositoryValidatorToken, () => new GitRepositoryValidator())
    container.registerSingleton(DialogServiceToken, () => new DialogService())

    // Application
    container.registerSingleton(
      RepositoryMainUseCaseToken,
      () =>
        new RepositoryMainUseCase(
          container.resolve(StoreRepositoryToken),
          container.resolve(GitRepositoryValidatorToken),
          container.resolve(DialogServiceToken),
        ),
    )
    container.registerSingleton(
      SettingsMainUseCaseToken,
      () => new SettingsMainUseCase(container.resolve(StoreRepositoryToken)),
    )
  },
  setUp: async (container) => {
    // Presentation: IPC Handler 登録
    const repoUseCase = container.resolve(RepositoryMainUseCaseToken)
    const settingsUseCase = container.resolve(SettingsMainUseCaseToken)
    registerIPCHandlers(repoUseCase, settingsUseCase)

    // tearDown
    return () => {
      // 将来的に ipcMain.removeHandler() を呼ぶ場合はここに追加
    }
  },
}
