import type { GitDiffQuery, GitLogQuery } from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  GetBranchesMainUseCase,
  GetCommitDetailMainUseCase,
  GetDiffCommitMainUseCase,
  GetDiffMainUseCase,
  GetDiffStagedMainUseCase,
  GetFileContentsCommitMainUseCase,
  GetFileContentsMainUseCase,
  GetFileTreeMainUseCase,
  GetLogMainUseCase,
  GetStatusMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@lib/ipc'
import { ipcMain } from 'electron'

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
      const message = error instanceof Error ? error.message : String(error)
      return ipcFailure<Awaited<T>>('INTERNAL_ERROR', message)
    })
}

const CHANNELS = [
  'git:status',
  'git:log',
  'git:commit-detail',
  'git:diff',
  'git:diff-staged',
  'git:diff-commit',
  'git:branches',
  'git:file-tree',
  'git:file-contents',
  'git:file-contents-commit',
] as const

export function registerGitIPCHandlers(
  getStatusUseCase: GetStatusMainUseCase,
  getLogUseCase: GetLogMainUseCase,
  getCommitDetailUseCase: GetCommitDetailMainUseCase,
  getDiffUseCase: GetDiffMainUseCase,
  getDiffStagedUseCase: GetDiffStagedMainUseCase,
  getDiffCommitUseCase: GetDiffCommitMainUseCase,
  getBranchesUseCase: GetBranchesMainUseCase,
  getFileTreeUseCase: GetFileTreeMainUseCase,
  getFileContentsUseCase: GetFileContentsMainUseCase,
  getFileContentsCommitUseCase: GetFileContentsCommitMainUseCase,
): () => void {
  ipcMain.handle('git:status', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return getStatusUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:log', (_event, query: GitLogQuery) =>
    wrapHandler(() => {
      validatePath(query.worktreePath, 'worktreePath')
      return getLogUseCase.invoke(query)
    }),
  )

  ipcMain.handle('git:commit-detail', (_event, args: { worktreePath: string; hash: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      validatePath(args.hash, 'hash')
      return getCommitDetailUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:diff', (_event, query: GitDiffQuery) =>
    wrapHandler(() => {
      validatePath(query.worktreePath, 'worktreePath')
      return getDiffUseCase.invoke(query)
    }),
  )

  ipcMain.handle('git:diff-staged', (_event, query: GitDiffQuery) =>
    wrapHandler(() => {
      validatePath(query.worktreePath, 'worktreePath')
      return getDiffStagedUseCase.invoke(query)
    }),
  )

  ipcMain.handle('git:diff-commit', (_event, args: { worktreePath: string; hash: string; filePath?: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      validatePath(args.hash, 'hash')
      return getDiffCommitUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:branches', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return getBranchesUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:file-tree', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return getFileTreeUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:file-contents', (_event, args: { worktreePath: string; filePath: string; staged?: boolean }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      validatePath(args.filePath, 'filePath')
      return getFileContentsUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:file-contents-commit', (_event, args: { worktreePath: string; hash: string; filePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      validatePath(args.hash, 'hash')
      validatePath(args.filePath, 'filePath')
      return getFileContentsCommitUseCase.invoke(args)
    }),
  )

  return () => {
    for (const channel of CHANNELS) {
      ipcMain.removeHandler(channel)
    }
  }
}
