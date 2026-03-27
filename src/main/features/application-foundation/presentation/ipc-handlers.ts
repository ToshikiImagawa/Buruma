import type { AppSettings, Theme } from '@shared/domain'
import type { IPCResult } from '@shared/types/ipc'
import type { RepositoryMainUseCase } from '../application/repository-main-usecase'
import type { SettingsMainUseCase } from '../application/settings-main-usecase'
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

export function registerIPCHandlers(repoUseCase: RepositoryMainUseCase, settingsUseCase: SettingsMainUseCase): void {
  ipcMain.handle('repository:open', () => wrapHandler(() => repoUseCase.openWithDialog()))

  ipcMain.handle('repository:open-path', (_event, path: string) =>
    wrapHandler(async () => {
      const result = await repoUseCase.openByPath(path)
      if (!result) {
        throw new Error('選択されたフォルダは有効な Git リポジトリではありません')
      }
      return result
    }),
  )

  ipcMain.handle('repository:validate', (_event, path: string) => wrapHandler(() => repoUseCase.validate(path)))

  ipcMain.handle('repository:get-recent', () => wrapHandler(() => repoUseCase.getRecent()))

  ipcMain.handle('repository:remove-recent', (_event, path: string) =>
    wrapHandler(() => repoUseCase.removeRecent(path)),
  )

  ipcMain.handle('repository:pin', (_event, arg: { path: string; pinned: boolean }) =>
    wrapHandler(() => repoUseCase.pin(arg.path, arg.pinned)),
  )

  ipcMain.handle('settings:get', () => wrapHandler(() => settingsUseCase.getAll()))

  ipcMain.handle('settings:set', (_event, settings: Partial<AppSettings>) =>
    wrapHandler(() => settingsUseCase.update(settings)),
  )

  ipcMain.handle('settings:get-theme', () => wrapHandler(() => settingsUseCase.getTheme()))

  ipcMain.handle('settings:set-theme', (_event, theme: Theme) => wrapHandler(() => settingsUseCase.setTheme(theme)))
}
