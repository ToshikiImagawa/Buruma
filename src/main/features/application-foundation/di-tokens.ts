import type { AppSettings, RecentRepository, RepositoryInfo, Theme } from '@shared/domain'
import type { ConsumerUseCase, FunctionUseCase, SupplierUseCase } from '@shared/lib/usecase/types'
import type { IDialogRepository, IGitValidationRepository, IStoreRepository } from './application/repository-interfaces'
import { createToken } from '@shared/lib/di'

// --- Repository IF ---
export const StoreRepositoryToken = createToken<IStoreRepository>('StoreRepository')
export const GitValidationRepositoryToken = createToken<IGitValidationRepository>('GitValidationRepository')
export const DialogRepositoryToken = createToken<IDialogRepository>('DialogRepository')

// --- Application UseCase 型 ---
export type OpenRepositoryWithDialogMainUseCase = SupplierUseCase<Promise<RepositoryInfo | null>>
export type OpenRepositoryByPathMainUseCase = FunctionUseCase<string, Promise<RepositoryInfo | null>>
export type ValidateRepositoryMainUseCase = FunctionUseCase<string, Promise<boolean>>
export type GetRecentRepositoriesMainUseCase = SupplierUseCase<RecentRepository[]>
export type RemoveRecentRepositoryMainUseCase = ConsumerUseCase<string>
export type PinRepositoryMainUseCase = ConsumerUseCase<{ path: string; pinned: boolean }>
export type GetSettingsMainUseCase = SupplierUseCase<AppSettings>
export type UpdateSettingsMainUseCase = ConsumerUseCase<Partial<AppSettings>>
export type GetThemeMainUseCase = SupplierUseCase<Theme>
export type SetThemeMainUseCase = ConsumerUseCase<Theme>

// --- Application UseCase Tokens ---
export const OpenRepositoryWithDialogMainUseCaseToken = createToken<OpenRepositoryWithDialogMainUseCase>(
  'OpenRepositoryWithDialogMainUseCase',
)
export const OpenRepositoryByPathMainUseCaseToken = createToken<OpenRepositoryByPathMainUseCase>(
  'OpenRepositoryByPathMainUseCase',
)
export const ValidateRepositoryMainUseCaseToken = createToken<ValidateRepositoryMainUseCase>(
  'ValidateRepositoryMainUseCase',
)
export const GetRecentRepositoriesMainUseCaseToken = createToken<GetRecentRepositoriesMainUseCase>(
  'GetRecentRepositoriesMainUseCase',
)
export const RemoveRecentRepositoryMainUseCaseToken = createToken<RemoveRecentRepositoryMainUseCase>(
  'RemoveRecentRepositoryMainUseCase',
)
export const PinRepositoryMainUseCaseToken = createToken<PinRepositoryMainUseCase>('PinRepositoryMainUseCase')
export const GetSettingsMainUseCaseToken = createToken<GetSettingsMainUseCase>('GetSettingsMainUseCase')
export const UpdateSettingsMainUseCaseToken = createToken<UpdateSettingsMainUseCase>('UpdateSettingsMainUseCase')
export const GetThemeMainUseCaseToken = createToken<GetThemeMainUseCase>('GetThemeMainUseCase')
export const SetThemeMainUseCaseToken = createToken<SetThemeMainUseCase>('SetThemeMainUseCase')
