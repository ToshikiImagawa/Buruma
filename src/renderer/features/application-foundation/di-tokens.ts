/**
 * application-foundation の DI トークン定義
 */
import type { AppSettings, ErrorNotification, RecentRepository, RepositoryInfo } from '@shared/domain'
import type {
  ConsumerUseCase,
  ObservableStoreUseCase,
  ReactivePropertyUseCase,
  RunnableUseCase,
} from '@shared/lib/usecase'
import type { RepositoryRepository } from './application/repositories/repository-repository'
import type { SettingsRepository } from './application/repositories/settings-repository'
import type { IErrorNotificationService } from './application/services/error-notification-service-interface'
import type { IRepositoryService } from './application/services/repository-service-interface'
import type { ISettingsService } from './application/services/settings-service-interface'
import type {
  IErrorNotificationViewModel,
  IRepositorySelectorViewModel,
  ISettingsViewModel,
} from './presentation/viewmodel-interfaces'
import { createToken } from '@shared/lib/di'

// re-export for convenience
export type { RepositoryRepository } from './application/repositories/repository-repository'
export type { SettingsRepository } from './application/repositories/settings-repository'
export type { IRepositoryService } from './application/services/repository-service-interface'
export type { ISettingsService } from './application/services/settings-service-interface'
export type { IErrorNotificationService } from './application/services/error-notification-service-interface'
export type {
  IRepositorySelectorViewModel,
  ISettingsViewModel,
  IErrorNotificationViewModel,
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

// --- DI Tokens ---

// Services
export const RepositoryServiceToken = createToken<IRepositoryService>('RepositoryService')
export const SettingsServiceToken = createToken<ISettingsService>('SettingsService')
export const ErrorNotificationServiceToken = createToken<IErrorNotificationService>('ErrorNotificationService')

// Repositories
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

// ViewModels
export const RepositorySelectorViewModelToken = createToken<IRepositorySelectorViewModel>('RepositorySelectorViewModel')
export const SettingsViewModelToken = createToken<ISettingsViewModel>('SettingsViewModel')
export const ErrorNotificationViewModelToken = createToken<IErrorNotificationViewModel>('ErrorNotificationViewModel')
