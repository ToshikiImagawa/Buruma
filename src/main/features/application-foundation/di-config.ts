import type { VContainerConfig } from '@shared/lib/di'
import type { AppStore, StoreSchema } from './infrastructure/store-schema'
import Store from 'electron-store'
import { GetRecentRepositoriesMainUseCase } from './application/usecases/get-recent-repositories-main-usecase'
import { GetSettingsMainUseCase } from './application/usecases/get-settings-main-usecase'
import { GetThemeMainUseCase } from './application/usecases/get-theme-main-usecase'
import { OpenRepositoryByPathMainUseCase } from './application/usecases/open-repository-by-path-main-usecase'
import { OpenRepositoryWithDialogMainUseCase } from './application/usecases/open-repository-with-dialog-main-usecase'
import { PinRepositoryMainUseCase } from './application/usecases/pin-repository-main-usecase'
import { RemoveRecentRepositoryMainUseCase } from './application/usecases/remove-recent-repository-main-usecase'
import { SetThemeMainUseCase } from './application/usecases/set-theme-main-usecase'
import { UpdateSettingsMainUseCase } from './application/usecases/update-settings-main-usecase'
import { ValidateRepositoryMainUseCase } from './application/usecases/validate-repository-main-usecase'
import {
  DialogRepositoryToken,
  GetRecentRepositoriesMainUseCaseToken,
  GetSettingsMainUseCaseToken,
  GetThemeMainUseCaseToken,
  GitValidationRepositoryToken,
  OpenRepositoryByPathMainUseCaseToken,
  OpenRepositoryWithDialogMainUseCaseToken,
  PinRepositoryMainUseCaseToken,
  RemoveRecentRepositoryMainUseCaseToken,
  SetThemeMainUseCaseToken,
  StoreRepositoryToken,
  UpdateSettingsMainUseCaseToken,
  ValidateRepositoryMainUseCaseToken,
} from './di-tokens'
import { ElectronDialogRepository } from './infrastructure/dialog-repository'
import { GitValidationRepository } from './infrastructure/git-validation-repository'
import { StoreRepository } from './infrastructure/store-repository'
import { storeDefaults } from './infrastructure/store-schema'
import { registerIPCHandlers } from './presentation/ipc-handlers'

export const applicationFoundationMainConfig: VContainerConfig = {
  register(container) {
    // Repositories
    const store = new Store<StoreSchema>({
      defaults: storeDefaults,
    }) as unknown as AppStore

    container
      .registerSingleton(StoreRepositoryToken, () => new StoreRepository(store))
      .registerSingleton(GitValidationRepositoryToken, GitValidationRepository)
      .registerSingleton(DialogRepositoryToken, ElectronDialogRepository)

    // Application UseCases (useClass + deps)
    container
      .registerSingleton(OpenRepositoryWithDialogMainUseCaseToken, OpenRepositoryWithDialogMainUseCase, [
        StoreRepositoryToken,
        GitValidationRepositoryToken,
        DialogRepositoryToken,
      ])
      .registerSingleton(OpenRepositoryByPathMainUseCaseToken, OpenRepositoryByPathMainUseCase, [
        StoreRepositoryToken,
        GitValidationRepositoryToken,
      ])
      .registerSingleton(ValidateRepositoryMainUseCaseToken, ValidateRepositoryMainUseCase, [
        GitValidationRepositoryToken,
      ])
      .registerSingleton(GetRecentRepositoriesMainUseCaseToken, GetRecentRepositoriesMainUseCase, [
        StoreRepositoryToken,
      ])
      .registerSingleton(RemoveRecentRepositoryMainUseCaseToken, RemoveRecentRepositoryMainUseCase, [
        StoreRepositoryToken,
      ])
      .registerSingleton(PinRepositoryMainUseCaseToken, PinRepositoryMainUseCase, [StoreRepositoryToken])
      .registerSingleton(GetSettingsMainUseCaseToken, GetSettingsMainUseCase, [StoreRepositoryToken])
      .registerSingleton(UpdateSettingsMainUseCaseToken, UpdateSettingsMainUseCase, [StoreRepositoryToken])
      .registerSingleton(GetThemeMainUseCaseToken, GetThemeMainUseCase, [StoreRepositoryToken])
      .registerSingleton(SetThemeMainUseCaseToken, SetThemeMainUseCase, [StoreRepositoryToken])
  },
  setUp: async (container) => {
    registerIPCHandlers(
      container.resolve(OpenRepositoryWithDialogMainUseCaseToken),
      container.resolve(OpenRepositoryByPathMainUseCaseToken),
      container.resolve(ValidateRepositoryMainUseCaseToken),
      container.resolve(GetRecentRepositoriesMainUseCaseToken),
      container.resolve(RemoveRecentRepositoryMainUseCaseToken),
      container.resolve(PinRepositoryMainUseCaseToken),
      container.resolve(GetSettingsMainUseCaseToken),
      container.resolve(UpdateSettingsMainUseCaseToken),
      container.resolve(GetThemeMainUseCaseToken),
      container.resolve(SetThemeMainUseCaseToken),
    )

    return () => {}
  },
}
