import type { AppSettings, Theme } from '@shared/domain'
import type { IPCResult } from '@shared/types/ipc'
import type {
  GetRecentRepositoriesMainUseCase,
  GetSettingsMainUseCase,
  GetThemeMainUseCase,
  OpenRepositoryByPathMainUseCase,
  OpenRepositoryWithDialogMainUseCase,
  PinRepositoryMainUseCase,
  RemoveRecentRepositoryMainUseCase,
  SetThemeMainUseCase,
  UpdateSettingsMainUseCase,
  ValidateRepositoryMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@shared/types/ipc'
import { ipcMain } from 'electron'

function wrapHandler<T>(handler: () => T | Promise<T>): Promise<IPCResult<Awaited<T>>> {
  return Promise.resolve()
    .then(() => handler())
    .then((data) => ipcSuccess(data as Awaited<T>))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return ipcFailure<Awaited<T>>('INTERNAL_ERROR', message)
    })
}

export function registerIPCHandlers(
  openWithDialogUseCase: OpenRepositoryWithDialogMainUseCase,
  openByPathUseCase: OpenRepositoryByPathMainUseCase,
  validateUseCase: ValidateRepositoryMainUseCase,
  getRecentUseCase: GetRecentRepositoriesMainUseCase,
  removeRecentUseCase: RemoveRecentRepositoryMainUseCase,
  pinUseCase: PinRepositoryMainUseCase,
  getSettingsUseCase: GetSettingsMainUseCase,
  updateSettingsUseCase: UpdateSettingsMainUseCase,
  getThemeUseCase: GetThemeMainUseCase,
  setThemeUseCase: SetThemeMainUseCase,
): void {
  ipcMain.handle('repository:open', () => wrapHandler(() => openWithDialogUseCase.invoke()))

  ipcMain.handle('repository:open-path', (_event, path: string) =>
    wrapHandler(async () => {
      const result = await openByPathUseCase.invoke(path)
      if (!result) {
        throw new Error('選択されたフォルダは有効な Git リポジトリではありません')
      }
      return result
    }),
  )

  ipcMain.handle('repository:validate', (_event, path: string) => wrapHandler(() => validateUseCase.invoke(path)))

  ipcMain.handle('repository:get-recent', () => wrapHandler(() => getRecentUseCase.invoke()))

  ipcMain.handle('repository:remove-recent', (_event, path: string) =>
    wrapHandler(() => removeRecentUseCase.invoke(path)),
  )

  ipcMain.handle('repository:pin', (_event, arg: { path: string; pinned: boolean }) =>
    wrapHandler(() => pinUseCase.invoke(arg)),
  )

  ipcMain.handle('settings:get', () => wrapHandler(() => getSettingsUseCase.invoke()))

  ipcMain.handle('settings:set', (_event, settings: Partial<AppSettings>) =>
    wrapHandler(() => updateSettingsUseCase.invoke(settings)),
  )

  ipcMain.handle('settings:get-theme', () => wrapHandler(() => getThemeUseCase.invoke()))

  ipcMain.handle('settings:set-theme', (_event, theme: Theme) => wrapHandler(() => setThemeUseCase.invoke(theme)))
}
