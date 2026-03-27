import type { WorktreeCreateParams, WorktreeDeleteParams } from '@shared/domain'
import type { IPCResult } from '@shared/types/ipc'
import type { WorktreeMainUseCase } from '../application/worktree-main-usecase'
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

export function registerIPCHandlers(useCase: WorktreeMainUseCase): void {
  ipcMain.handle('worktree:list', (_event, repoPath: string) => wrapHandler(() => useCase.list(repoPath)))

  ipcMain.handle('worktree:status', (_event, params: { repoPath: string; worktreePath: string }) =>
    wrapHandler(() => useCase.getStatus(params.repoPath, params.worktreePath)),
  )

  ipcMain.handle('worktree:create', (_event, params: WorktreeCreateParams) => wrapHandler(() => useCase.create(params)))

  ipcMain.handle('worktree:delete', (_event, params: WorktreeDeleteParams) => wrapHandler(() => useCase.delete(params)))

  ipcMain.handle('worktree:suggest-path', (_event, params: { repoPath: string; branch: string }) =>
    wrapHandler(() => useCase.suggestPath(params.repoPath, params.branch)),
  )

  ipcMain.handle('worktree:check-dirty', (_event, worktreePath: string) =>
    wrapHandler(() => useCase.checkDirty(worktreePath)),
  )

  ipcMain.handle('worktree:default-branch', (_event, repoPath: string) =>
    wrapHandler(() => useCase.getDefaultBranch(repoPath)),
  )
}
