import type { VContainerConfig } from '@lib/di'
import { ClaudeDefaultService } from './application/services/claude-service'
import { CheckAuthUseCase } from './application/usecases/check-auth-usecase'
import { GetCurrentSessionUseCase } from './application/usecases/get-current-session-usecase'
import { GetOutputsUseCase } from './application/usecases/get-outputs-usecase'
import { GetSessionStatusUseCase } from './application/usecases/get-session-status-usecase'
import { LoginUseCase } from './application/usecases/login-usecase'
import { SendCommandUseCase } from './application/usecases/send-command-usecase'
import { StartSessionUseCase } from './application/usecases/start-session-usecase'
import { StopSessionUseCase } from './application/usecases/stop-session-usecase'
import {
  CheckAuthRendererUseCaseToken,
  ClaudeRepositoryToken,
  ClaudeServiceToken,
  ClaudeSessionViewModelToken,
  GetCurrentSessionRendererUseCaseToken,
  GetOutputsRendererUseCaseToken,
  GetSessionStatusRendererUseCaseToken,
  LoginRendererUseCaseToken,
  SendCommandRendererUseCaseToken,
  StartSessionRendererUseCaseToken,
  StopSessionRendererUseCaseToken,
} from './di-tokens'
import { ClaudeDefaultRepository } from './infrastructure/repositories/claude-default-repository'
import { ClaudeSessionDefaultViewModel } from './presentation/claude-session-viewmodel'

export const claudeCodeIntegrationConfig: VContainerConfig = {
  register(container) {
    container
      .registerSingleton(ClaudeRepositoryToken, ClaudeDefaultRepository)
      .registerSingleton(ClaudeServiceToken, ClaudeDefaultService)
      .registerSingleton(StartSessionRendererUseCaseToken, StartSessionUseCase, [
        ClaudeRepositoryToken,
        ClaudeServiceToken,
      ])
      .registerSingleton(StopSessionRendererUseCaseToken, StopSessionUseCase, [
        ClaudeRepositoryToken,
        ClaudeServiceToken,
      ])
      .registerSingleton(SendCommandRendererUseCaseToken, SendCommandUseCase, [ClaudeRepositoryToken])
      .registerSingleton(GetSessionStatusRendererUseCaseToken, GetSessionStatusUseCase, [ClaudeServiceToken])
      .registerSingleton(GetCurrentSessionRendererUseCaseToken, GetCurrentSessionUseCase, [ClaudeServiceToken])
      .registerSingleton(GetOutputsRendererUseCaseToken, GetOutputsUseCase, [ClaudeServiceToken])
      .registerSingleton(CheckAuthRendererUseCaseToken, CheckAuthUseCase, [ClaudeRepositoryToken])
      .registerSingleton(LoginRendererUseCaseToken, LoginUseCase, [ClaudeRepositoryToken])
      .registerTransient(ClaudeSessionViewModelToken, ClaudeSessionDefaultViewModel, [
        StartSessionRendererUseCaseToken,
        StopSessionRendererUseCaseToken,
        SendCommandRendererUseCaseToken,
        GetSessionStatusRendererUseCaseToken,
        GetOutputsRendererUseCaseToken,
      ])
  },

  setUp: async (container) => {
    const service = container.resolve(ClaudeServiceToken)
    const repo = container.resolve(ClaudeRepositoryToken)

    service.setUp()

    // 初回認証チェック
    const checkAuthUseCase = container.resolve(CheckAuthRendererUseCaseToken)
    service.setAuthChecking(true)
    checkAuthUseCase
      .invoke()
      .then((status) => service.setAuthStatus(status))
      .catch(() => service.setAuthStatus({ authenticated: false }))
      .finally(() => service.setAuthChecking(false))

    const unsubOutput = repo.onOutput((output) => {
      service.appendOutput(output)
    })

    const unsubSessionChanged = repo.onSessionChanged((session) => {
      service.updateSession(session)
    })

    return () => {
      unsubOutput()
      unsubSessionChanged()
      service.tearDown()
    }
  },
}
