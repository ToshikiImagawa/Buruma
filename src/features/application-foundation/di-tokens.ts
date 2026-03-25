/**
 * application-foundation の DI トークン定義
 */
import { createToken } from '@/lib/di'
import type { Observable } from 'rxjs'
import type {
  AppSettings,
  ErrorNotification,
  RecentRepository,
  RepositoryInfo,
  Theme,
} from './domain'
import type { ConsumerUseCase, ObservableStoreUseCase, ReactivePropertyUseCase, RunnableUseCase } from '@/lib/usecase'

// --- Repository IF ---

export interface RepositoryRepository {
  open(): Promise<RepositoryInfo | null>
  openByPath(path: string): Promise<RepositoryInfo | null>
  validate(path: string): Promise<boolean>
  getRecent(): Promise<RecentRepository[]>
  removeRecent(path: string): Promise<void>
  pin(path: string, pinned: boolean): Promise<void>
}

export interface SettingsRepository {
  get(): Promise<AppSettings>
  update(settings: Partial<AppSettings>): Promise<void>
  getTheme(): Promise<Theme>
  setTheme(theme: Theme): Promise<void>
}

// --- Service IF ---

export interface IRepositoryService {
  readonly currentRepository$: Observable<RepositoryInfo | null>
  readonly recentRepositories$: Observable<RecentRepository[]>
  setCurrentRepository(repo: RepositoryInfo | null): void
  updateRecentRepositories(repos: RecentRepository[]): void
}

export interface ISettingsService {
  readonly settings$: Observable<AppSettings>
  updateSettings(settings: Partial<AppSettings>): void
  replaceSettings(settings: AppSettings): void
}

export interface IErrorNotificationService {
  readonly notifications$: Observable<ErrorNotification[]>
  addNotification(notification: ErrorNotification): void
  removeNotification(id: string): void
  clear(): void
}

// --- ViewModel IF ---

export interface IRepositorySelectorViewModel {
  readonly recentRepositories$: Observable<RecentRepository[]>
  readonly currentRepository$: Observable<RepositoryInfo | null>
  openWithDialog(): void
  openByPath(path: string): void
  removeRecent(path: string): void
  pin(path: string, pinned: boolean): void
}

export interface ISettingsViewModel {
  readonly settings$: Observable<AppSettings>
  updateSettings(settings: Partial<AppSettings>): void
  setTheme(theme: Theme): void
}

export interface IErrorNotificationViewModel {
  readonly notifications$: Observable<ErrorNotification[]>
  dismiss(errorId: string): void
  retry(errorId: string): void
}

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
export const GetRecentRepositoriesUseCaseToken = createToken<GetRecentRepositoriesUseCase>('GetRecentRepositoriesUseCase')
export const RemoveRecentRepositoryUseCaseToken =
  createToken<RemoveRecentRepositoryUseCase>('RemoveRecentRepositoryUseCase')
export const PinRepositoryUseCaseToken = createToken<PinRepositoryUseCase>('PinRepositoryUseCase')
export const GetSettingsUseCaseToken = createToken<GetSettingsUseCase>('GetSettingsUseCase')
export const UpdateSettingsUseCaseToken = createToken<UpdateSettingsUseCase>('UpdateSettingsUseCase')
export const GetErrorNotificationsUseCaseToken =
  createToken<GetErrorNotificationsUseCase>('GetErrorNotificationsUseCase')
export const DismissErrorUseCaseToken = createToken<DismissErrorUseCase>('DismissErrorUseCase')
export const RetryErrorUseCaseToken = createToken<RetryErrorUseCase>('RetryErrorUseCase')

// ViewModels
export const RepositorySelectorViewModelToken =
  createToken<IRepositorySelectorViewModel>('RepositorySelectorViewModel')
export const SettingsViewModelToken = createToken<ISettingsViewModel>('SettingsViewModel')
export const ErrorNotificationViewModelToken =
  createToken<IErrorNotificationViewModel>('ErrorNotificationViewModel')
