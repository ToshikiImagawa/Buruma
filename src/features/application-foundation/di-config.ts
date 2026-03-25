import type { VContainerConfig } from '@/lib/di'
import { ErrorNotificationService } from './application/error-notification-service'
// Services
import { RepositoryService } from './application/repository-service'
import { SettingsService } from './application/settings-service'
import { DismissErrorUseCaseImpl } from './application/usecases/dismiss-error-usecase'
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

    // UseCases (singleton)
    container
      .registerSingleton(OpenRepositoryUseCaseToken, () => {
        const repo = container.resolve(RepositoryRepositoryToken)
        const service = container.resolve(RepositoryServiceToken)
        const errorService = container.resolve(ErrorNotificationServiceToken)
        return new OpenRepositoryUseCaseImpl(repo, service, errorService)
      })
      .registerSingleton(OpenRepositoryByPathUseCaseToken, () => {
        const repo = container.resolve(RepositoryRepositoryToken)
        const service = container.resolve(RepositoryServiceToken)
        const errorService = container.resolve(ErrorNotificationServiceToken)
        return new OpenRepositoryByPathUseCaseImpl(repo, service, errorService)
      })
      .registerSingleton(GetRecentRepositoriesUseCaseToken, () => {
        const service = container.resolve(RepositoryServiceToken)
        return new GetRecentRepositoriesUseCaseImpl(service)
      })
      .registerSingleton(RemoveRecentRepositoryUseCaseToken, () => {
        const repo = container.resolve(RepositoryRepositoryToken)
        const service = container.resolve(RepositoryServiceToken)
        return new RemoveRecentRepositoryUseCaseImpl(repo, service)
      })
      .registerSingleton(PinRepositoryUseCaseToken, () => {
        const repo = container.resolve(RepositoryRepositoryToken)
        const service = container.resolve(RepositoryServiceToken)
        return new PinRepositoryUseCaseImpl(repo, service)
      })
      .registerSingleton(GetSettingsUseCaseToken, () => {
        const service = container.resolve(SettingsServiceToken)
        return new GetSettingsUseCaseImpl(service)
      })
      .registerSingleton(UpdateSettingsUseCaseToken, () => {
        const repo = container.resolve(SettingsRepositoryToken)
        const service = container.resolve(SettingsServiceToken)
        return new UpdateSettingsUseCaseImpl(repo, service)
      })
      .registerSingleton(GetErrorNotificationsUseCaseToken, () => {
        const service = container.resolve(ErrorNotificationServiceToken)
        return new GetErrorNotificationsUseCaseImpl(service)
      })
      .registerSingleton(DismissErrorUseCaseToken, () => {
        const service = container.resolve(ErrorNotificationServiceToken)
        return new DismissErrorUseCaseImpl(service)
      })
      .registerSingleton(RetryErrorUseCaseToken, () => {
        const service = container.resolve(ErrorNotificationServiceToken)
        return new RetryErrorUseCaseImpl(service)
      })

    // ViewModels (transient)
    container
      .registerTransient(RepositorySelectorViewModelToken, () => {
        const openRepo = container.resolve(OpenRepositoryUseCaseToken)
        const openByPath = container.resolve(OpenRepositoryByPathUseCaseToken)
        const getRecent = container.resolve(GetRecentRepositoriesUseCaseToken)
        const removeRecent = container.resolve(RemoveRecentRepositoryUseCaseToken)
        const pin = container.resolve(PinRepositoryUseCaseToken)
        const repoService = container.resolve(RepositoryServiceToken)
        return new RepositorySelectorViewModel(openRepo, openByPath, getRecent, removeRecent, pin, repoService)
      })
      .registerTransient(SettingsViewModelToken, () => {
        const getSettings = container.resolve(GetSettingsUseCaseToken)
        const updateSettings = container.resolve(UpdateSettingsUseCaseToken)
        return new SettingsViewModel(getSettings, updateSettings)
      })
      .registerTransient(ErrorNotificationViewModelToken, () => {
        const getNotifications = container.resolve(GetErrorNotificationsUseCaseToken)
        const dismiss = container.resolve(DismissErrorUseCaseToken)
        const retry = container.resolve(RetryErrorUseCaseToken)
        return new ErrorNotificationViewModel(getNotifications, dismiss, retry)
      })
  },

  setUp: async (container) => {
    // 初期データをロード
    const settingsRepo = container.resolve(SettingsRepositoryToken)
    const settingsService = container.resolve(SettingsServiceToken)
    const repoRepo = container.resolve(RepositoryRepositoryToken)
    const repoService = container.resolve(RepositoryServiceToken)

    const [settings, recent] = await Promise.all([settingsRepo.get(), repoRepo.getRecent()])
    settingsService.replaceSettings(settings)
    repoService.updateRecentRepositories(recent)

    // tearDown: BehaviorSubject の complete
    return () => {
      const repositoryService = container.resolve(RepositoryServiceToken) as RepositoryService
      const settingsServiceInst = container.resolve(SettingsServiceToken) as SettingsService
      const errorService = container.resolve(ErrorNotificationServiceToken) as ErrorNotificationService
      repositoryService.dispose()
      settingsServiceInst.dispose()
      errorService.dispose()
    }
  },
}
