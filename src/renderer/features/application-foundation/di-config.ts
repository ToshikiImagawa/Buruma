import type { VContainerConfig } from '@shared/lib/di'
// Services
import { ErrorNotificationService } from './application/services/error-notification-service'
import { RepositoryService } from './application/services/repository-service'
import { SettingsService } from './application/services/settings-service'
import { DismissErrorUseCaseImpl } from './application/usecases/dismiss-error-usecase'
import { GetCurrentRepositoryUseCaseImpl } from './application/usecases/get-current-repository-usecase'
import { GetErrorNotificationsUseCaseImpl } from './application/usecases/get-error-notifications-usecase'
import { GetRecentRepositoriesUseCaseImpl } from './application/usecases/get-recent-repositories-usecase'
import { GetSettingsUseCaseImpl } from './application/usecases/get-settings-usecase'
import { OpenRepositoryByPathUseCaseImpl } from './application/usecases/open-repository-by-path-usecase'
// UseCases
import { OpenRepositoryUseCaseImpl } from './application/usecases/open-repository-usecase'
import { PinRepositoryUseCaseImpl } from './application/usecases/pin-repository-usecase'
import { RemoveRecentRepositoryUseCaseImpl } from './application/usecases/remove-recent-repository-usecase'
import { RetryErrorUseCaseImpl } from './application/usecases/retry-error-usecase'
import { UpdateSettingsUseCaseImpl } from './application/usecases/update-settings-usecase'
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
import { RepositoryRepositoryImpl } from './infrastructure/repository-repository-impl'
import { SettingsRepositoryImpl } from './infrastructure/settings-repository-impl'
import { ErrorNotificationViewModel } from './presentation/error-notification-viewmodel'
// ViewModels
import { RepositorySelectorViewModel } from './presentation/repository-selector-viewmodel'
import { SettingsViewModel } from './presentation/settings-viewmodel'

export const applicationFoundationConfig: VContainerConfig = {
  register: (container) => {
    // Repositories (singleton)
    container
      .registerSingleton(RepositoryRepositoryToken, RepositoryRepositoryImpl)
      .registerSingleton(SettingsRepositoryToken, SettingsRepositoryImpl)

    // Services (singleton)
    container
      .registerSingleton(RepositoryServiceToken, RepositoryService)
      .registerSingleton(SettingsServiceToken, SettingsService)
      .registerSingleton(ErrorNotificationServiceToken, ErrorNotificationService)

    // UseCases (singleton, useClass + deps)
    container
      .registerSingleton(OpenRepositoryUseCaseToken, OpenRepositoryUseCaseImpl, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
        ErrorNotificationServiceToken,
      ])
      .registerSingleton(OpenRepositoryByPathUseCaseToken, OpenRepositoryByPathUseCaseImpl, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
        ErrorNotificationServiceToken,
      ])
      .registerSingleton(GetRecentRepositoriesUseCaseToken, GetRecentRepositoriesUseCaseImpl, [RepositoryServiceToken])
      .registerSingleton(RemoveRecentRepositoryUseCaseToken, RemoveRecentRepositoryUseCaseImpl, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
      ])
      .registerSingleton(PinRepositoryUseCaseToken, PinRepositoryUseCaseImpl, [
        RepositoryRepositoryToken,
        RepositoryServiceToken,
      ])
      .registerSingleton(GetSettingsUseCaseToken, GetSettingsUseCaseImpl, [SettingsServiceToken])
      .registerSingleton(UpdateSettingsUseCaseToken, UpdateSettingsUseCaseImpl, [
        SettingsRepositoryToken,
        SettingsServiceToken,
      ])
      .registerSingleton(GetErrorNotificationsUseCaseToken, GetErrorNotificationsUseCaseImpl, [
        ErrorNotificationServiceToken,
      ])
      .registerSingleton(DismissErrorUseCaseToken, DismissErrorUseCaseImpl, [ErrorNotificationServiceToken])
      .registerSingleton(RetryErrorUseCaseToken, RetryErrorUseCaseImpl, [ErrorNotificationServiceToken])
      .registerSingleton(GetCurrentRepositoryUseCaseToken, GetCurrentRepositoryUseCaseImpl, [RepositoryServiceToken])

    // ViewModels (transient, useClass + deps)
    container
      .registerTransient(RepositorySelectorViewModelToken, RepositorySelectorViewModel, [
        OpenRepositoryUseCaseToken,
        OpenRepositoryByPathUseCaseToken,
        GetRecentRepositoriesUseCaseToken,
        RemoveRecentRepositoryUseCaseToken,
        PinRepositoryUseCaseToken,
        GetCurrentRepositoryUseCaseToken,
      ])
      .registerTransient(SettingsViewModelToken, SettingsViewModel, [
        GetSettingsUseCaseToken,
        UpdateSettingsUseCaseToken,
      ])
      .registerTransient(ErrorNotificationViewModelToken, ErrorNotificationViewModel, [
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
