import type { VContainerConfig } from '@shared/lib/di'
// Services
import { ErrorNotificationDefaultService } from './application/services/error-notification-service'
import { RepositoryDefaultService } from './application/services/repository-service'
import { SettingsDefaultService } from './application/services/settings-service'
import { DismissErrorDefaultUseCase } from './application/usecases/dismiss-error-usecase'
import { GetCurrentRepositoryDefaultUseCase } from './application/usecases/get-current-repository-usecase'
import { GetErrorNotificationsDefaultUseCase } from './application/usecases/get-error-notifications-usecase'
import { GetRecentRepositoriesDefaultUseCase } from './application/usecases/get-recent-repositories-usecase'
import { GetSettingsDefaultUseCase } from './application/usecases/get-settings-usecase'
import { OpenRepositoryByPathDefaultUseCase } from './application/usecases/open-repository-by-path-usecase'
// UseCases
import { OpenRepositoryDefaultUseCase } from './application/usecases/open-repository-usecase'
import { PinRepositoryDefaultUseCase } from './application/usecases/pin-repository-usecase'
import { RemoveRecentRepositoryDefaultUseCase } from './application/usecases/remove-recent-repository-usecase'
import { RetryErrorDefaultUseCase } from './application/usecases/retry-error-usecase'
import { UpdateSettingsDefaultUseCase } from './application/usecases/update-settings-usecase'
import {
  DismissErrorUseCaseToken,
  ErrorNotificationServiceToken,
  ErrorNotificationViewModelToken,
  GetCurrentRepositoryUseCaseToken,
  GetErrorNotificationsUseCaseToken,
  GetRecentRepositoriesUseCaseToken,
  GetSettingsUseCaseToken,
  OpenRepositoryByPathUseCaseToken,
  // UseCase tokens
  OpenRepositoryUseCaseToken,
  PinRepositoryUseCaseToken,
  RemoveRecentRepositoryUseCaseToken,
  // Repository tokens
  RepositoryRepositoryToken,
  // ViewModel tokens
  RepositorySelectorViewModelToken,
  // Service tokens
  RepositoryServiceToken,
  RetryErrorUseCaseToken,
  SettingsRepositoryToken,
  SettingsServiceToken,
  SettingsViewModelToken,
  UpdateSettingsUseCaseToken,
} from './di-tokens'
// Infrastructure (renderer-side)
import { RepositoryDefaultRepository } from './infrastructure/repositories/repository-default-repository'
import { SettingsDefaultRepository } from './infrastructure/repositories/settings-default-repository'
import { ErrorNotificationDefaultViewModel } from './presentation/error-notification-viewmodel'
// ViewModels
import { RepositorySelectorDefaultViewModel } from './presentation/repository-selector-viewmodel'
import { SettingsDefaultViewModel } from './presentation/settings-viewmodel'

export const applicationFoundationConfig: VContainerConfig = {
  register: (container) => {
    // Repositories (singleton)
    container
      .registerSingleton(RepositoryRepositoryToken, RepositoryDefaultRepository)
      .registerSingleton(SettingsRepositoryToken, SettingsDefaultRepository)

    // Services (singleton)
    container
      .registerSingleton(RepositoryServiceToken, RepositoryDefaultService)
      .registerSingleton(SettingsServiceToken, SettingsDefaultService)
      .registerSingleton(ErrorNotificationServiceToken, ErrorNotificationDefaultService)

    // UseCases (singleton, useClass + deps)
    container
      .registerSingleton(OpenRepositoryUseCaseToken, OpenRepositoryDefaultUseCase, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
        ErrorNotificationServiceToken,
      ])
      .registerSingleton(OpenRepositoryByPathUseCaseToken, OpenRepositoryByPathDefaultUseCase, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
        ErrorNotificationServiceToken,
      ])
      .registerSingleton(GetRecentRepositoriesUseCaseToken, GetRecentRepositoriesDefaultUseCase, [
        RepositoryServiceToken,
      ])
      .registerSingleton(RemoveRecentRepositoryUseCaseToken, RemoveRecentRepositoryDefaultUseCase, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
      ])
      .registerSingleton(PinRepositoryUseCaseToken, PinRepositoryDefaultUseCase, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
      ])
      .registerSingleton(GetSettingsUseCaseToken, GetSettingsDefaultUseCase, [SettingsServiceToken])
      .registerSingleton(UpdateSettingsUseCaseToken, UpdateSettingsDefaultUseCase, [
        SettingsRepositoryToken,
        SettingsServiceToken,
      ])
      .registerSingleton(GetErrorNotificationsUseCaseToken, GetErrorNotificationsDefaultUseCase, [
        ErrorNotificationServiceToken,
      ])
      .registerSingleton(DismissErrorUseCaseToken, DismissErrorDefaultUseCase, [ErrorNotificationServiceToken])
      .registerSingleton(RetryErrorUseCaseToken, RetryErrorDefaultUseCase, [ErrorNotificationServiceToken])
      .registerSingleton(GetCurrentRepositoryUseCaseToken, GetCurrentRepositoryDefaultUseCase, [RepositoryServiceToken])

    // ViewModels (transient, useClass + deps)
    container
      .registerTransient(RepositorySelectorViewModelToken, RepositorySelectorDefaultViewModel, [
        OpenRepositoryUseCaseToken,
        OpenRepositoryByPathUseCaseToken,
        GetRecentRepositoriesUseCaseToken,
        RemoveRecentRepositoryUseCaseToken,
        PinRepositoryUseCaseToken,
        GetCurrentRepositoryUseCaseToken,
      ])
      .registerTransient(SettingsViewModelToken, SettingsDefaultViewModel, [
        GetSettingsUseCaseToken,
        UpdateSettingsUseCaseToken,
      ])
      .registerTransient(ErrorNotificationViewModelToken, ErrorNotificationDefaultViewModel, [
        GetErrorNotificationsUseCaseToken,
        DismissErrorUseCaseToken,
        RetryErrorUseCaseToken,
      ])
  },

  setUp: async (container) => {
    // 初期データをロード
    const settingsRepo = container.resolve(SettingsRepositoryToken)
    const repoRepo = container.resolve(RepositoryRepositoryToken)
    const [settings, recent] = await Promise.all([settingsRepo.get(), repoRepo.getRecent()])

    // Service の setUp で初期データを注入
    const repoService = container.resolve(RepositoryServiceToken)
    const settingsService = container.resolve(SettingsServiceToken)
    const errorService = container.resolve(ErrorNotificationServiceToken)
    repoService.setUp(recent)
    settingsService.setUp(settings)
    errorService.setUp()

    // tearDown: インターフェース経由で各 Service の tearDown() を呼び出し
    return () => {
      repoService.tearDown()
      settingsService.tearDown()
      errorService.tearDown()
    }
  },
}
