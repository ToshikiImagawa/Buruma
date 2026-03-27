import type { IDialogService, IGitRepositoryValidator, IStoreRepository } from './application/repository-interfaces'
import type { RepositoryMainUseCase } from './application/repository-main-usecase'
import type { SettingsMainUseCase } from './application/settings-main-usecase'
import { createToken } from '@shared/lib/di'

// --- Infrastructure IF ---
export const StoreRepositoryToken = createToken<IStoreRepository>('StoreRepository')
export const GitRepositoryValidatorToken = createToken<IGitRepositoryValidator>('GitRepositoryValidator')
export const DialogServiceToken = createToken<IDialogService>('DialogService')

// --- Application UseCase ---
export const RepositoryMainUseCaseToken = createToken<RepositoryMainUseCase>('RepositoryMainUseCase')
export const SettingsMainUseCaseToken = createToken<SettingsMainUseCase>('SettingsMainUseCase')
