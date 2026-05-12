import type { InjectionToken, VContainerConfig } from '@lib/di'
import type { ObservableStoreUseCase } from '@lib/usecase'
import type { Observable } from 'rxjs'
import type { ClaudeService } from './application/services/claude-service-interface'
import { ObservableQueryUseCase } from '@lib/usecase'
import { ClaudeDefaultService } from './application/services/claude-service'
import { CheckAuthUseCase } from './application/usecases/check-auth-usecase'
import { ExplainDiffUseCase } from './application/usecases/explain-diff-usecase'
import { GenerateCommitMessageUseCase } from './application/usecases/generate-commit-message-usecase'
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
      .registerSingleton(ClaudeServiceToken, ClaudeDefaultService, [ClaudeRepositoryToken])
      // 操作系 UseCase
      .registerSingleton(StartSessionRendererUseCaseToken, StartSessionUseCase, [ClaudeServiceToken])
      .registerSingleton(StopSessionRendererUseCaseToken, StopSessionUseCase, [ClaudeRepositoryToken])
      .registerSingleton(SendCommandRendererUseCaseToken, SendCommandUseCase, [
        ClaudeRepositoryToken,
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
      .registerSingleton(ResolveConflictRendererUseCaseToken, ResolveConflictUseCase, [ClaudeRepositoryToken])

    // 状態取得 UseCase: Service の Observable を ObservableQueryUseCase で包み、
    // 各 Token を遅延解決ファクトリーで登録する。
    const registerQuery = <T>(
      token: InjectionToken<ObservableStoreUseCase<T>>,
      selector: (service: ClaudeService) => Observable<T>,
    ): void => {
      container.registerSingleton(
        token,
        () => new ObservableQueryUseCase(selector(container.resolve(ClaudeServiceToken))),
      )
    }
    registerQuery(GetSessionStatusRendererUseCaseToken, (s) => s.status$)
    registerQuery(GetCurrentSessionRendererUseCaseToken, (s) => s.currentSession$)
    registerQuery(GetOutputsRendererUseCaseToken, (s) => s.outputs$)
    registerQuery(GetChatMessagesRendererUseCaseToken, (s) => s.chatMessages$)
    registerQuery(GetIsCommandRunningRendererUseCaseToken, (s) => s.isCommandRunning$)
    registerQuery(GetConversationsRendererUseCaseToken, (s) => s.conversations$)
    registerQuery(GetCurrentConversationIdRendererUseCaseToken, (s) => s.currentConversationId$)
    registerQuery(GetReviewCommentsRendererUseCaseToken, (s) => s.reviewComments$)
    registerQuery(GetReviewSummaryRendererUseCaseToken, (s) => s.reviewSummary$)
    registerQuery(GetIsReviewingRendererUseCaseToken, (s) => s.isReviewing$)
    registerQuery(GetExplanationRendererUseCaseToken, (s) => s.explanation$)
    registerQuery(GetIsExplainingRendererUseCaseToken, (s) => s.isExplaining$)

    container
      // ViewModel
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
    await service.loadConversations()

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
        service.appendToLastAssistantMessage(output.content + '\n', output.sessionId)
      }
    })

    const unsubSessionChanged = repo.onSessionChanged((session) => {
      service.updateSession(session)
    })

    const unsubCommandCompleted = repo.onCommandCompleted((data) => {
      service.finalizeLastAssistantMessage(data.sessionId)
      service.setCommandRunning(false, data.sessionId)
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
