import type { VContainerConfig } from '@lib/di'
import { ClaudeDefaultService } from './application/services/claude-service'
import { GetCurrentSessionUseCase } from './application/usecases/get-current-session-usecase'
import { GetOutputsUseCase } from './application/usecases/get-outputs-usecase'
import { GetSessionStatusUseCase } from './application/usecases/get-session-status-usecase'
import { SendCommandUseCase } from './application/usecases/send-command-usecase'
import { StartSessionUseCase } from './application/usecases/start-session-usecase'
import { StopSessionUseCase } from './application/usecases/stop-session-usecase'
import {
  ClaudeRepositoryToken,
  ClaudeServiceToken,
  ClaudeSessionViewModelToken,
  GetCurrentSessionRendererUseCaseToken,
  GetOutputsRendererUseCaseToken,
  GetSessionStatusRendererUseCaseToken,
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
