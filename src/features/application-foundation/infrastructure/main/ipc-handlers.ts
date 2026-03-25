import { ipcMain } from 'electron'
import type { RepositoryMainService } from './repository-main-service'
import type { SettingsMainService } from './settings-main-service'

export function registerIPCHandlers(
  repoService: RepositoryMainService,
  settingsService: SettingsMainService,
): void {
  ipcMain.handle('repository:open', () => repoService.openWithDialog())
  ipcMain.handle('repository:open-path', (_event, path: string) => repoService.openByPath(path))
  ipcMain.handle('repository:validate', (_event, path: string) => repoService.validate(path))
  ipcMain.handle('repository:get-recent', () => repoService.getRecent())
  ipcMain.handle('repository:remove-recent', (_event, path: string) => repoService.removeRecent(path))
  ipcMain.handle('repository:pin', (_event, arg: { path: string; pinned: boolean }) =>
    repoService.pin(arg.path, arg.pinned),
  )

  ipcMain.handle('settings:get', () => settingsService.getAll())
  ipcMain.handle('settings:set', (_event, settings) => settingsService.update(settings))
  ipcMain.handle('settings:get-theme', () => settingsService.getTheme())
  ipcMain.handle('settings:set-theme', (_event, theme) => settingsService.setTheme(theme))
}
