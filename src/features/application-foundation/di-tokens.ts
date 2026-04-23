/**
 * application-foundation の DI トークン定義
 */
import type { AppSettings, ErrorNotification, RecentRepository, RepositoryInfo } from '@domain'
import type { ConsumerUseCase, ObservableStoreUseCase, ReactivePropertyUseCase, RunnableUseCase } from '@lib/usecase'
import type { ExternalAppRepository } from './application/repositories/external-app-repository'
import type { RepositoryRepository } from './application/repositories/repository-repository'
import type { SettingsRepository } from './application/repositories/settings-repository'
import type { ErrorNotificationService } from './application/services/error-notification-service-interface'
import type { RepositoryService } from './application/services/repository-service-interface'
import type { SettingsService } from './application/services/settings-service-interface'
import type {
  ErrorNotificationViewModel,
  RepositorySelectorViewModel,
  SettingsViewModel,
} from './presentation/viewmodel-interfaces'
import { createToken } from '@lib/di'

// re-export for convenience
export type { ExternalAppRepository } from './application/repositories/external-app-repository'
export type { RepositoryRepository } from './application/repositories/repository-repository'
export type { SettingsRepository } from './application/repositories/settings-repository'
export type { RepositoryService } from './application/services/repository-service-interface'
export type { SettingsService } from './application/services/settings-service-interface'
export type { ErrorNotificationService } from './application/services/error-notification-service-interface'
export type {
  RepositorySelectorViewModel,
  SettingsViewModel,
  ErrorNotificationViewModel,
} from './presentation/viewmodel-interfaces'

// --- UseCase types ---
export type OpenRepositoryUseCase = RunnableUseCase
export type OpenRepositoryByPathUseCase = ConsumerUseCase<string>
export type GetRecentRepositoriesUseCase = ObservableStoreUseCase<RecentRepository[]>
export type RemoveRecentRepositoryUseCase = ConsumerUseCase<string>
export type PinRepositoryUseCase = ConsumerUseCase<{ path: string; pinned: boolean }>
export type GetSettingsUseCase = ReactivePropertyUseCase<AppSettings>
export type UpdateSettingsUseCase = ConsumerUseCase<Partial<AppSettings>>
export type GetErrorNotificationsUseCase = ObservableStoreUseCase<ErrorNotification[]>
export type DismissErrorUseCase = ConsumerUseCase<string>
export type RetryErrorUseCase = ConsumerUseCase<string>
export type GetCurrentRepositoryUseCase = ObservableStoreUseCase<RepositoryInfo | null>
export type OpenFileInDefaultAppUseCase = ConsumerUseCase<string>

// --- DI Tokens ---

// Services
export const RepositoryServiceToken = createToken<RepositoryService>('RepositoryService')
export const SettingsServiceToken = createToken<SettingsService>('SettingsService')
export const ErrorNotificationServiceToken = createToken<ErrorNotificationService>('ErrorNotificationService')

// Repositories
export const ExternalAppRepositoryToken = createToken<ExternalAppRepository>('ExternalAppRepository')
export const RepositoryRepositoryToken = createToken<RepositoryRepository>('RepositoryRepository')
export const SettingsRepositoryToken = createToken<SettingsRepository>('SettingsRepository')

// UseCases
export const OpenRepositoryUseCaseToken = createToken<OpenRepositoryUseCase>('OpenRepositoryUseCase')
export const OpenRepositoryByPathUseCaseToken = createToken<OpenRepositoryByPathUseCase>('OpenRepositoryByPathUseCase')
export const GetRecentRepositoriesUseCaseToken =
  createToken<GetRecentRepositoriesUseCase>('GetRecentRepositoriesUseCase')
export const RemoveRecentRepositoryUseCaseToken = createToken<RemoveRecentRepositoryUseCase>(
  'RemoveRecentRepositoryUseCase',
)
export const PinRepositoryUseCaseToken = createToken<PinRepositoryUseCase>('PinRepositoryUseCase')
export const GetSettingsUseCaseToken = createToken<GetSettingsUseCase>('GetSettingsUseCase')
export const UpdateSettingsUseCaseToken = createToken<UpdateSettingsUseCase>('UpdateSettingsUseCase')
export const GetErrorNotificationsUseCaseToken =
  createToken<GetErrorNotificationsUseCase>('GetErrorNotificationsUseCase')
export const DismissErrorUseCaseToken = createToken<DismissErrorUseCase>('DismissErrorUseCase')
export const RetryErrorUseCaseToken = createToken<RetryErrorUseCase>('RetryErrorUseCase')
export const GetCurrentRepositoryUseCaseToken = createToken<GetCurrentRepositoryUseCase>('GetCurrentRepositoryUseCase')
export const OpenFileInDefaultAppUseCaseToken = createToken<OpenFileInDefaultAppUseCase>('OpenFileInDefaultAppUseCase')

// ViewModels
export const RepositorySelectorViewModelToken = createToken<RepositorySelectorViewModel>('RepositorySelectorViewModel')
export const SettingsViewModelToken = createToken<SettingsViewModel>('SettingsViewModel')
export const ErrorNotificationViewModelToken = createToken<ErrorNotificationViewModel>('ErrorNotificationViewModel')
