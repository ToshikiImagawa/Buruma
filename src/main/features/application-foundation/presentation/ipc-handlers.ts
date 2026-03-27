import type { RepositoryMainUseCase } from '../application/repository-main-usecase'
import type { SettingsMainUseCase } from '../application/settings-main-usecase'
import { ipcMain } from 'electron'
import { ipcFailure, ipcSuccess } from '@/shared/types/ipc'

export function registerIPCHandlers(
  repoUseCase: RepositoryMainUseCase,
  settingsUseCase: SettingsMainUseCase,
): void {
  ipcMain.handle('repository:open', async () => {
    const result = await repoUseCase.openWithDialog()
    return ipcSuccess(result)
  })

  ipcMain.handle('repository:open-path', async (_event, path: string) => {
    const result = await repoUseCase.openByPath(path)
    if (!result) {
      return ipcFailure('INVALID_REPOSITORY', '選択されたフォルダは有効な Git リポジトリではありません')
    }
    return ipcSuccess(result)
  })

  ipcMain.handle('repository:validate', async (_event, path: string) => {
    const result = await repoUseCase.validate(path)
    return ipcSuccess(result)
  })

  ipcMain.handle('repository:get-recent', () => {
    return ipcSuccess(repoUseCase.getRecent())
  })

  ipcMain.handle('repository:remove-recent', (_event, path: string) => {
    repoUseCase.removeRecent(path)
    return ipcSuccess(undefined)
  })

  ipcMain.handle('repository:pin', (_event, arg: { path: string; pinned: boolean }) => {
    repoUseCase.pin(arg.path, arg.pinned)
    return ipcSuccess(undefined)
  })

  ipcMain.handle('settings:get', () => {
    return ipcSuccess(settingsUseCase.getAll())
  })

  ipcMain.handle('settings:set', (_event, settings) => {
    settingsUseCase.update(settings)
    return ipcSuccess(undefined)
  })

  ipcMain.handle('settings:get-theme', () => {
    return ipcSuccess(settingsUseCase.getTheme())
  })

  ipcMain.handle('settings:set-theme', (_event, theme) => {
    settingsUseCase.setTheme(theme)
    return ipcSuccess(undefined)
  })
}
