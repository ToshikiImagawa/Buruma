import type { ClaudeCommand } from '@domain'
import type { IPCResult } from '@lib/ipc'
import type {
  GetAllSessionsMainUseCase,
  GetOutputMainUseCase,
  GetSessionMainUseCase,
  SendCommandMainUseCase,
  StartSessionMainUseCase,
  StopSessionMainUseCase,
} from '../di-tokens'
import { ipcFailure, ipcSuccess } from '@lib/ipc'
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

const CHANNELS = [
  'claude:start-session',
  'claude:stop-session',
  'claude:get-session',
  'claude:get-all-sessions',
  'claude:send-command',
  'claude:get-output',
] as const

export function registerClaudeIPCHandlers(
  startSessionUseCase: StartSessionMainUseCase,
  stopSessionUseCase: StopSessionMainUseCase,
  getSessionUseCase: GetSessionMainUseCase,
  getAllSessionsUseCase: GetAllSessionsMainUseCase,
  sendCommandUseCase: SendCommandMainUseCase,
  getOutputUseCase: GetOutputMainUseCase,
): () => void {
  ipcMain.handle('claude:start-session', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => startSessionUseCase.invoke(args.worktreePath)),
  )

  ipcMain.handle('claude:stop-session', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => stopSessionUseCase.invoke(args.worktreePath)),
  )

  ipcMain.handle('claude:get-session', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => getSessionUseCase.invoke(args.worktreePath)),
  )

  ipcMain.handle('claude:get-all-sessions', () => wrapHandler(() => getAllSessionsUseCase.invoke()))

  ipcMain.handle('claude:send-command', (_event, command: ClaudeCommand) =>
    wrapHandler(() => sendCommandUseCase.invoke(command)),
  )

  ipcMain.handle('claude:get-output', (_event, args: { worktreePath: string }) =>
    wrapHandler(() => getOutputUseCase.invoke(args.worktreePath)),
  )

  return () => {
    for (const channel of CHANNELS) {
      ipcMain.removeHandler(channel)
    }
  }
}
