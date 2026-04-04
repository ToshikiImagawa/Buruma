import type {
  MergeOptions,
  ConflictResolveOptions,
  ConflictResolveAllOptions,
} from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  MergeMainUseCase,
  MergeAbortMainUseCase,
  MergeStatusMainUseCase,
  ConflictListMainUseCase,
  ConflictFileContentMainUseCase,
  ConflictResolveMainUseCase,
  ConflictResolveAllMainUseCase,
  ConflictMarkResolvedMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@lib/ipc'
import { ipcMain } from 'electron'
import { GitAdvancedOperationError } from '../infrastructure/repositories/git-advanced-default-repository'

function validatePath(value: string | undefined, name: string): void {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} は必須です`)
  }
  if (value.includes('..')) {
    throw new Error(`${name} にパストラバーサルは許可されていません`)
  }
}

function wrapHandler<T>(handler: () => T | Promise<T>): Promise<IPCResult<Awaited<T>>> {
  return Promise.resolve()
    .then(() => handler())
    .then((data) => ipcSuccess(data as Awaited<T>))
    .catch((error: unknown) => {
      if (error instanceof GitAdvancedOperationError) {
        return ipcFailure<Awaited<T>>(error.code, error.message)
      }
      const message = error instanceof Error ? error.message : String(error)
      return ipcFailure<Awaited<T>>('INTERNAL_ERROR', message)
    })
}

const CHANNELS = [
  'git:merge',
  'git:merge-abort',
  'git:merge-status',
  'git:conflict-list',
  'git:conflict-file-content',
  'git:conflict-resolve',
  'git:conflict-resolve-all',
  'git:conflict-mark-resolved',
] as const

export function registerGitAdvancedIPCHandlers(
  mergeUseCase: MergeMainUseCase,
  mergeAbortUseCase: MergeAbortMainUseCase,
  mergeStatusUseCase: MergeStatusMainUseCase,
  conflictListUseCase: ConflictListMainUseCase,
  conflictFileContentUseCase: ConflictFileContentMainUseCase,
  conflictResolveUseCase: ConflictResolveMainUseCase,
  conflictResolveAllUseCase: ConflictResolveAllMainUseCase,
  conflictMarkResolvedUseCase: ConflictMarkResolvedMainUseCase,
): () => void {
  // --- マージ ---
  ipcMain.handle('git:merge', (_event, args: MergeOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:merge-abort', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeAbortUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('git:merge-status', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return mergeStatusUseCase.invoke(args.worktreePath)
    }),
  )

  // --- コンフリクト解決 ---
  ipcMain.handle('git:conflict-list', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictListUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle(
    'git:conflict-file-content',
    (_event, args: { worktreePath: string; filePath: string }) =>
      wrapHandler(() => {
        validatePath(args.worktreePath, 'worktreePath')
        return conflictFileContentUseCase.invoke(args)
      }),
  )

  ipcMain.handle('git:conflict-resolve', (_event, args: ConflictResolveOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictResolveUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:conflict-resolve-all', (_event, args: ConflictResolveAllOptions) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return conflictResolveAllUseCase.invoke(args)
    }),
  )

  ipcMain.handle(
    'git:conflict-mark-resolved',
    (_event, args: { worktreePath: string; filePath: string }) =>
      wrapHandler(() => {
        validatePath(args.worktreePath, 'worktreePath')
        return conflictMarkResolvedUseCase.invoke(args)
      }),
  )

  return () => {
    for (const channel of CHANNELS) {
      ipcMain.removeHandler(channel)
    }
  }
}
