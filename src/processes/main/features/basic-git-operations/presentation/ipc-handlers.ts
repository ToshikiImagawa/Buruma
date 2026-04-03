import type {
  BranchCheckoutArgs,
  BranchCreateArgs,
  BranchDeleteArgs,
  CommitArgs,
  FetchArgs,
  PullArgs,
  PushArgs,
} from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  CheckoutBranchMainUseCase,
  CommitMainUseCase,
  CreateBranchMainUseCase,
  DeleteBranchMainUseCase,
  FetchMainUseCase,
  PullMainUseCase,
  PushMainUseCase,
  StageAllMainUseCase,
  StageFilesMainUseCase,
  UnstageAllMainUseCase,
  UnstageFilesMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@lib/ipc'
import { ipcMain } from 'electron'
import { GitOperationError } from '../infrastructure/repositories/git-write-default-repository'

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
      if (error instanceof GitOperationError) {
        return ipcFailure<Awaited<T>>(error.code, error.message)
      }
      const message = error instanceof Error ? error.message : String(error)
      return ipcFailure<Awaited<T>>('INTERNAL_ERROR', message)
    })
}

const CHANNELS = [
  'git:stage',
  'git:stage-all',
  'git:unstage',
  'git:unstage-all',
  'git:commit',
  'git:push',
  'git:pull',
  'git:fetch',
  'git:branch-create',
  'git:branch-checkout',
  'git:branch-delete',
] as const

export function registerGitWriteIPCHandlers(
  stageFilesUseCase: StageFilesMainUseCase,
  unstageFilesUseCase: UnstageFilesMainUseCase,
  stageAllUseCase: StageAllMainUseCase,
  unstageAllUseCase: UnstageAllMainUseCase,
  commitUseCase: CommitMainUseCase,
  pushUseCase: PushMainUseCase,
  pullUseCase: PullMainUseCase,
  fetchUseCase: FetchMainUseCase,
  createBranchUseCase: CreateBranchMainUseCase,
  checkoutBranchUseCase: CheckoutBranchMainUseCase,
  deleteBranchUseCase: DeleteBranchMainUseCase,
): () => void {
  ipcMain.handle('git:stage', (_event, args: { worktreePath: string; files: string[] }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stageFilesUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:stage-all', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stageAllUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:unstage', (_event, args: { worktreePath: string; files: string[] }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return unstageFilesUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:unstage-all', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return unstageAllUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:commit', (_event, args: CommitArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return commitUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:push', (_event, args: PushArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return pushUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:pull', (_event, args: PullArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return pullUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:fetch', (_event, args: FetchArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return fetchUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:branch-create', (_event, args: BranchCreateArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return createBranchUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:branch-checkout', (_event, args: BranchCheckoutArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return checkoutBranchUseCase.invoke(args)
    }),
  )

  ipcMain.handle('git:branch-delete', (_event, args: BranchDeleteArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return deleteBranchUseCase.invoke(args)
    }),
  )

  return () => {
    for (const channel of CHANNELS) {
      ipcMain.removeHandler(channel)
    }
  }
}
