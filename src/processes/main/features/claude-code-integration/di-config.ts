import type { VContainerConfig } from '@lib/di'
import { BrowserWindow } from 'electron'
import { ClaudeDefaultSessionStore } from './application/services/claude-session-store'
import { GenerateTextMainUseCase } from './application/usecases/generate-text-main-usecase'
import { GetAllSessionsMainUseCase } from './application/usecases/get-all-sessions-main-usecase'
import { GetOutputMainUseCase } from './application/usecases/get-output-main-usecase'
import { GetSessionMainUseCase } from './application/usecases/get-session-main-usecase'
import { SendCommandMainUseCase } from './application/usecases/send-command-main-usecase'
import { StartSessionMainUseCase } from './application/usecases/start-session-main-usecase'
import { StopSessionMainUseCase } from './application/usecases/stop-session-main-usecase'
import {
  ClaudeProcessRepositoryToken,
  ClaudeSessionStoreToken,
  GenerateTextMainUseCaseToken,
  GetAllSessionsMainUseCaseToken,
  GetOutputMainUseCaseToken,
  GetSessionMainUseCaseToken,
  SendCommandMainUseCaseToken,
  StartSessionMainUseCaseToken,
  StopSessionMainUseCaseToken,
} from './di-tokens'
import { ClaudeProcessManager } from './infrastructure/claude-process-manager'
import { registerClaudeIPCHandlers } from './presentation/ipc-handlers'

export const claudeCodeIntegrationMainConfig: VContainerConfig = {
  register(container) {
    container
      .registerSingleton(ClaudeSessionStoreToken, ClaudeDefaultSessionStore)
      .registerSingleton(ClaudeProcessRepositoryToken, ClaudeProcessManager, [ClaudeSessionStoreToken])
      .registerSingleton(StartSessionMainUseCaseToken, StartSessionMainUseCase, [ClaudeProcessRepositoryToken])
      .registerSingleton(StopSessionMainUseCaseToken, StopSessionMainUseCase, [ClaudeProcessRepositoryToken])
      .registerSingleton(GetSessionMainUseCaseToken, GetSessionMainUseCase, [ClaudeProcessRepositoryToken])
      .registerSingleton(GetAllSessionsMainUseCaseToken, GetAllSessionsMainUseCase, [ClaudeProcessRepositoryToken])
      .registerSingleton(SendCommandMainUseCaseToken, SendCommandMainUseCase, [ClaudeProcessRepositoryToken])
      .registerSingleton(GetOutputMainUseCaseToken, GetOutputMainUseCase, [ClaudeProcessRepositoryToken])
      .registerSingleton(GenerateTextMainUseCaseToken, GenerateTextMainUseCase, [ClaudeProcessRepositoryToken])
  },

  setUp: async (container) => {
    const sessionStore = container.resolve(ClaudeSessionStoreToken)
    const processRepo = container.resolve(ClaudeProcessRepositoryToken) as ClaudeProcessManager

    sessionStore.setUp()

    // ストリーミング出力とセッション変更を BrowserWindow に転送
    const unsubOutput = processRepo.onOutput((output) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send('claude:output', output)
      }
    })

    const unsubSessionChanged = processRepo.onSessionChanged((session) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send('claude:session-changed', session)
      }
    })

    const unsubCommandCompleted = processRepo.onCommandCompleted((data) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send('claude:command-completed', data)
      }
    })

    const unregisterHandlers = registerClaudeIPCHandlers(
      container.resolve(StartSessionMainUseCaseToken),
      container.resolve(StopSessionMainUseCaseToken),
      container.resolve(GetSessionMainUseCaseToken),
      container.resolve(GetAllSessionsMainUseCaseToken),
      container.resolve(SendCommandMainUseCaseToken),
      container.resolve(GetOutputMainUseCaseToken),
      container.resolve(GenerateTextMainUseCaseToken),
    )

    return async () => {
      unregisterHandlers()
      unsubOutput()
      unsubSessionChanged()
      unsubCommandCompleted()
      await processRepo.stopAllSessions()
      sessionStore.tearDown()
    }
  },
}
