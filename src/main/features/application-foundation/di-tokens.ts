import type { IDialogService, IGitRepositoryValidator, IStoreRepository } from './application/repository-interfaces'
import type { GetRecentRepositoriesMainUseCase } from './application/usecases/get-recent-repositories-main-usecase'
import type { GetSettingsMainUseCase } from './application/usecases/get-settings-main-usecase'
import type { GetThemeMainUseCase } from './application/usecases/get-theme-main-usecase'
import type { OpenRepositoryByPathMainUseCase } from './application/usecases/open-repository-by-path-main-usecase'
import type { OpenRepositoryWithDialogMainUseCase } from './application/usecases/open-repository-with-dialog-main-usecase'
import type { PinRepositoryMainUseCase } from './application/usecases/pin-repository-main-usecase'
import type { RemoveRecentRepositoryMainUseCase } from './application/usecases/remove-recent-repository-main-usecase'
import type { SetThemeMainUseCase } from './application/usecases/set-theme-main-usecase'
import type { UpdateSettingsMainUseCase } from './application/usecases/update-settings-main-usecase'
import type { ValidateRepositoryMainUseCase } from './application/usecases/validate-repository-main-usecase'
import { createToken } from '@shared/lib/di'

// --- Infrastructure IF ---
export const StoreRepositoryToken = createToken<IStoreRepository>('StoreRepository')
export const GitRepositoryValidatorToken = createToken<IGitRepositoryValidator>('GitRepositoryValidator')
export const DialogServiceToken = createToken<IDialogService>('DialogService')

// --- Application UseCases ---
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
