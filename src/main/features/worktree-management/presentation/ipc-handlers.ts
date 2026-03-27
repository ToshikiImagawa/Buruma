import type { WorktreeCreateParams, WorktreeDeleteParams } from '@shared/domain'
import type { IPCResult } from '@shared/types/ipc'
import type { CheckDirtyMainUseCase } from '../application/usecases/check-dirty-main-usecase'
import type { CreateWorktreeMainUseCase } from '../application/usecases/create-worktree-main-usecase'
import type { DeleteWorktreeMainUseCase } from '../application/usecases/delete-worktree-main-usecase'
import type { GetDefaultBranchMainUseCase } from '../application/usecases/get-default-branch-main-usecase'
import type { GetWorktreeStatusMainUseCase } from '../application/usecases/get-worktree-status-main-usecase'
import type { ListWorktreesMainUseCase } from '../application/usecases/list-worktrees-main-usecase'
import type { SuggestPathMainUseCase } from '../application/usecases/suggest-path-main-usecase'
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
  listUseCase: ListWorktreesMainUseCase,
  getStatusUseCase: GetWorktreeStatusMainUseCase,
  createUseCase: CreateWorktreeMainUseCase,
  deleteUseCase: DeleteWorktreeMainUseCase,
  suggestPathUseCase: SuggestPathMainUseCase,
  checkDirtyUseCase: CheckDirtyMainUseCase,
  getDefaultBranchUseCase: GetDefaultBranchMainUseCase,
): void {
  ipcMain.handle('worktree:list', (_event, repoPath: string) => wrapHandler(() => listUseCase.invoke(repoPath)))

  ipcMain.handle('worktree:status', (_event, params: { repoPath: string; worktreePath: string }) =>
    wrapHandler(() => getStatusUseCase.invoke(params)),
  )

  ipcMain.handle('worktree:create', (_event, params: WorktreeCreateParams) =>
    wrapHandler(() => createUseCase.invoke(params)),
  )

  ipcMain.handle('worktree:delete', (_event, params: WorktreeDeleteParams) =>
    wrapHandler(() => deleteUseCase.invoke(params)),
  )

  ipcMain.handle('worktree:suggest-path', (_event, params: { repoPath: string; branch: string }) =>
    wrapHandler(() => suggestPathUseCase.invoke(params)),
  )

  ipcMain.handle('worktree:check-dirty', (_event, worktreePath: string) =>
    wrapHandler(() => checkDirtyUseCase.invoke(worktreePath)),
  )

  ipcMain.handle('worktree:default-branch', (_event, repoPath: string) =>
    wrapHandler(() => getDefaultBranchUseCase.invoke(repoPath)),
  )
}
