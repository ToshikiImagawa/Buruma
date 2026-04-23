import type { VContainerConfig } from '@lib/di'
import { ClaudeDefaultService } from './application/services/claude-service'
import { CheckAuthUseCase } from './application/usecases/check-auth-usecase'
import { ExplainDiffUseCase } from './application/usecases/explain-diff-usecase'
import { GenerateCommitMessageUseCase } from './application/usecases/generate-commit-message-usecase'
import { GetChatMessagesUseCase } from './application/usecases/get-chat-messages-usecase'
import { GetConversationsUseCase } from './application/usecases/get-conversations-usecase'
import { GetCurrentConversationIdUseCase } from './application/usecases/get-current-conversation-id-usecase'
import { GetCurrentSessionUseCase } from './application/usecases/get-current-session-usecase'
import { GetExplanationUseCase } from './application/usecases/get-explanation-usecase'
import { GetIsCommandRunningUseCase } from './application/usecases/get-is-command-running-usecase'
import { GetIsExplainingUseCase } from './application/usecases/get-is-explaining-usecase'
import { GetIsReviewingUseCase } from './application/usecases/get-is-reviewing-usecase'
import { GetOutputsUseCase } from './application/usecases/get-outputs-usecase'
import { GetReviewCommentsUseCase } from './application/usecases/get-review-comments-usecase'
import { GetReviewSummaryUseCase } from './application/usecases/get-review-summary-usecase'
import { GetSessionStatusUseCase } from './application/usecases/get-session-status-usecase'
import { LoginUseCase } from './application/usecases/login-usecase'
import { LogoutUseCase } from './application/usecases/logout-usecase'
import { ResolveConflictUseCase } from './application/usecases/resolve-conflict-usecase'
import { ReviewDiffUseCase } from './application/usecases/review-diff-usecase'
import { SendCommandUseCase } from './application/usecases/send-command-usecase'
import { StartSessionUseCase } from './application/usecases/start-session-usecase'
import { StopSessionUseCase } from './application/usecases/stop-session-usecase'
import {
  CheckAuthRendererUseCaseToken,
  ClaudeConflictViewModelToken,
  ClaudeExplainViewModelToken,
  ClaudeRepositoryToken,
  ClaudeReviewViewModelToken,
  ClaudeServiceToken,
  ClaudeSessionViewModelToken,
  ExplainDiffRendererUseCaseToken,
  GenerateCommitMessageRendererUseCaseToken,
  GetChatMessagesRendererUseCaseToken,
  GetConversationsRendererUseCaseToken,
  GetCurrentConversationIdRendererUseCaseToken,
  GetCurrentSessionRendererUseCaseToken,
  GetExplanationRendererUseCaseToken,
  GetIsCommandRunningRendererUseCaseToken,
  GetIsExplainingRendererUseCaseToken,
  GetIsReviewingRendererUseCaseToken,
  GetOutputsRendererUseCaseToken,
  GetReviewCommentsRendererUseCaseToken,
  GetReviewSummaryRendererUseCaseToken,
  GetSessionStatusRendererUseCaseToken,
  LoginRendererUseCaseToken,
  LogoutRendererUseCaseToken,
  ResolveConflictRendererUseCaseToken,
  ReviewDiffRendererUseCaseToken,
  SendCommandRendererUseCaseToken,
  StartSessionRendererUseCaseToken,
  StopSessionRendererUseCaseToken,
} from './di-tokens'
import { ClaudeDefaultRepository } from './infrastructure/repositories/claude-default-repository'
import { ClaudeConflictDefaultViewModel } from './presentation/claude-conflict-viewmodel'
import { ClaudeExplainDefaultViewModel } from './presentation/claude-explain-viewmodel'
import { ClaudeReviewDefaultViewModel } from './presentation/claude-review-viewmodel'
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
      .registerSingleton(SendCommandRendererUseCaseToken, SendCommandUseCase, [
        ClaudeRepositoryToken,
        ClaudeServiceToken,
      ])
      .registerSingleton(GetSessionStatusRendererUseCaseToken, GetSessionStatusUseCase, [ClaudeServiceToken])
      .registerSingleton(GetCurrentSessionRendererUseCaseToken, GetCurrentSessionUseCase, [ClaudeServiceToken])
      .registerSingleton(GetOutputsRendererUseCaseToken, GetOutputsUseCase, [ClaudeServiceToken])
      .registerSingleton(GetChatMessagesRendererUseCaseToken, GetChatMessagesUseCase, [ClaudeServiceToken])
      .registerSingleton(GetIsCommandRunningRendererUseCaseToken, GetIsCommandRunningUseCase, [ClaudeServiceToken])
      .registerSingleton(GetConversationsRendererUseCaseToken, GetConversationsUseCase, [ClaudeServiceToken])
      .registerSingleton(GetCurrentConversationIdRendererUseCaseToken, GetCurrentConversationIdUseCase, [
        ClaudeServiceToken,
      ])
      .registerSingleton(CheckAuthRendererUseCaseToken, CheckAuthUseCase, [ClaudeRepositoryToken])
      .registerSingleton(LoginRendererUseCaseToken, LoginUseCase, [ClaudeRepositoryToken])
      .registerSingleton(LogoutRendererUseCaseToken, LogoutUseCase, [ClaudeRepositoryToken])
      .registerSingleton(GenerateCommitMessageRendererUseCaseToken, GenerateCommitMessageUseCase, [
        ClaudeRepositoryToken,
      ])
      .registerSingleton(ReviewDiffRendererUseCaseToken, ReviewDiffUseCase, [ClaudeRepositoryToken, ClaudeServiceToken])
      .registerSingleton(ExplainDiffRendererUseCaseToken, ExplainDiffUseCase, [
        ClaudeRepositoryToken,
        ClaudeServiceToken,
      ])
      .registerSingleton(GetReviewCommentsRendererUseCaseToken, GetReviewCommentsUseCase, [ClaudeServiceToken])
      .registerSingleton(GetReviewSummaryRendererUseCaseToken, GetReviewSummaryUseCase, [ClaudeServiceToken])
      .registerSingleton(GetIsReviewingRendererUseCaseToken, GetIsReviewingUseCase, [ClaudeServiceToken])
      .registerSingleton(GetExplanationRendererUseCaseToken, GetExplanationUseCase, [ClaudeServiceToken])
      .registerSingleton(GetIsExplainingRendererUseCaseToken, GetIsExplainingUseCase, [ClaudeServiceToken])
      .registerSingleton(ResolveConflictRendererUseCaseToken, ResolveConflictUseCase, [ClaudeRepositoryToken])
      .registerTransient(ClaudeConflictViewModelToken, ClaudeConflictDefaultViewModel, [
        ResolveConflictRendererUseCaseToken,
        ClaudeServiceToken,
      ])
      .registerTransient(ClaudeReviewViewModelToken, ClaudeReviewDefaultViewModel, [
        ReviewDiffRendererUseCaseToken,
        GetReviewCommentsRendererUseCaseToken,
        GetReviewSummaryRendererUseCaseToken,
        GetIsReviewingRendererUseCaseToken,
      ])
      .registerTransient(ClaudeExplainViewModelToken, ClaudeExplainDefaultViewModel, [
        ExplainDiffRendererUseCaseToken,
        GetExplanationRendererUseCaseToken,
        GetIsExplainingRendererUseCaseToken,
      ])
      .registerTransient(ClaudeSessionViewModelToken, ClaudeSessionDefaultViewModel, [
        StartSessionRendererUseCaseToken,
        StopSessionRendererUseCaseToken,
        SendCommandRendererUseCaseToken,
        GetSessionStatusRendererUseCaseToken,
        GetOutputsRendererUseCaseToken,
        GetChatMessagesRendererUseCaseToken,
        GetIsCommandRunningRendererUseCaseToken,
        GetConversationsRendererUseCaseToken,
        GetCurrentConversationIdRendererUseCaseToken,
        ClaudeServiceToken,
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
      if (output.stream === 'stdout') {
        service.appendToLastAssistantMessage(output.content + '\n')
      }
    })

    const unsubSessionChanged = repo.onSessionChanged((session) => {
      service.updateSession(session)
    })

    const unsubCommandCompleted = repo.onCommandCompleted(() => {
      service.finalizeLastAssistantMessage()
      service.setCommandRunning(false)
    })

    const unsubReviewResult = repo.onReviewResult((result) => {
      service.setReviewResult(result)
      service.setReviewing(false)
    })

    const unsubExplainResult = repo.onExplainResult((result) => {
      service.setExplainResult(result)
      service.setExplaining(false)
    })

    const unsubConflictResolved = repo.onConflictResolved((result) => {
      service.setConflictResult(result)
    })

    return () => {
      unsubOutput()
      unsubSessionChanged()
      unsubCommandCompleted()
      unsubReviewResult()
      unsubExplainResult()
      unsubConflictResolved()
      service.tearDown()
    }
  },
}
