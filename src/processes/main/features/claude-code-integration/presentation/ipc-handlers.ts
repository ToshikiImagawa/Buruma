import type { ClaudeCommand, DiffTarget, GenerateCommitMessageArgs } from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  CheckAuthMainUseCase,
  ExplainDiffMainUseCaseType,
  GenerateCommitMessageMainUseCase,
  GetAllSessionsMainUseCase,
  GetOutputMainUseCase,
  GetSessionMainUseCase,
  LoginMainUseCase,
  LogoutMainUseCase,
  ReviewDiffMainUseCaseType,
  SendCommandMainUseCase,
  StartSessionMainUseCase,
  StopSessionMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@lib/ipc'
import { BrowserWindow, ipcMain } from 'electron'

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
  'claude:start-session',
  'claude:stop-session',
  'claude:get-session',
  'claude:get-all-sessions',
  'claude:send-command',
  'claude:get-output',
  'claude:generate-commit-message',
  'claude:check-auth',
  'claude:login',
  'claude:logout',
  'claude:review-diff',
  'claude:explain-diff',
] as const

export function registerClaudeIPCHandlers(
  startSessionUseCase: StartSessionMainUseCase,
  stopSessionUseCase: StopSessionMainUseCase,
  getSessionUseCase: GetSessionMainUseCase,
  getAllSessionsUseCase: GetAllSessionsMainUseCase,
  sendCommandUseCase: SendCommandMainUseCase,
  getOutputUseCase: GetOutputMainUseCase,
  generateCommitMessageUseCase: GenerateCommitMessageMainUseCase,
  checkAuthUseCase: CheckAuthMainUseCase,
  loginUseCase: LoginMainUseCase,
  logoutUseCase: LogoutMainUseCase,
  reviewDiffUseCase: ReviewDiffMainUseCaseType,
  explainDiffUseCase: ExplainDiffMainUseCaseType,
): () => void {
  ipcMain.handle('claude:start-session', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return startSessionUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('claude:stop-session', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return stopSessionUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('claude:get-session', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return getSessionUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('claude:get-all-sessions', () => wrapHandler(() => getAllSessionsUseCase.invoke()))

  ipcMain.handle('claude:send-command', (_event, command: ClaudeCommand) =>
    wrapHandler(() => {
      validatePath(command.worktreePath, 'worktreePath')
      return sendCommandUseCase.invoke(command)
    }),
  )

  ipcMain.handle('claude:get-output', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      return getOutputUseCase.invoke(args.worktreePath)
    }),
  )

  ipcMain.handle('claude:generate-commit-message', (_event, args: GenerateCommitMessageArgs) =>
    wrapHandler(() => {
      validatePath(args.worktreePath, 'worktreePath')
      if (!args.diffText || typeof args.diffText !== 'string' || args.diffText.trim() === '') {
        throw new Error('diffText は必須です')
      }
      return generateCommitMessageUseCase.invoke(args)
    }),
  )

  ipcMain.handle('claude:check-auth', () => wrapHandler(() => checkAuthUseCase.invoke()))

  ipcMain.handle('claude:login', () => wrapHandler(() => loginUseCase.invoke()))

  ipcMain.handle('claude:logout', () => wrapHandler(() => logoutUseCase.invoke()))

  ipcMain.handle(
    'claude:review-diff',
    (_event, args: { worktreePath: string; diffTarget: DiffTarget; diffText: string }) =>
      wrapHandler(async () => {
        validatePath(args.worktreePath, 'worktreePath')
        if (!args.diffText || typeof args.diffText !== 'string' || args.diffText.trim() === '') {
          throw new Error('diffText は必須です')
        }
        const result = await reviewDiffUseCase.invoke({
          worktreePath: args.worktreePath,
          diffTarget: args.diffTarget,
          diffText: args.diffText,
        })
        const win = BrowserWindow.getAllWindows()[0]
        if (win && !win.isDestroyed()) {
          win.webContents.send('claude:review-result', result)
        }
      }),
  )

  ipcMain.handle(
    'claude:explain-diff',
    (_event, args: { worktreePath: string; diffTarget: DiffTarget; diffText: string }) =>
      wrapHandler(async () => {
        validatePath(args.worktreePath, 'worktreePath')
        if (!args.diffText || typeof args.diffText !== 'string' || args.diffText.trim() === '') {
          throw new Error('diffText は必須です')
        }
        const result = await explainDiffUseCase.invoke({
          worktreePath: args.worktreePath,
          diffTarget: args.diffTarget,
          diffText: args.diffText,
        })
        const win = BrowserWindow.getAllWindows()[0]
        if (win && !win.isDestroyed()) {
          win.webContents.send('claude:explain-result', result)
        }
      }),
  )

  return () => {
    for (const channel of CHANNELS) {
      ipcMain.removeHandler(channel)
    }
  }
}
