import type { AppSettings, RecentRepository, RepositoryInfo, Theme } from '@domain'
import type { ConsumerUseCase, FunctionUseCase, SupplierUseCase } from '@lib/usecase/types'
import type { DialogRepository, GitValidationRepository, StoreRepository } from './application/repositories/types'
import { createToken } from '@lib/di'

// --- Repository IF ---
export const StoreRepositoryToken = createToken<StoreRepository>('StoreRepository')
export const GitValidationRepositoryToken = createToken<GitValidationRepository>('GitValidationRepository')
export const DialogRepositoryToken = createToken<DialogRepository>('DialogRepository')

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
