import type { InjectionToken, VContainerConfig } from '@lib/di'
import type { ObservableStoreUseCase } from '@lib/usecase'
import type { Observable } from 'rxjs'
import type { ChatHistoryService } from './application/services/chat-history-service-interface'
import type { ClaudeStateService } from './application/services/claude-state-service-interface'
import { ObservableQueryUseCase } from '@lib/usecase'
import { ChatHistoryDefaultService } from './application/services/chat-history-service'
import { ClaudeStateDefaultService } from './application/services/claude-state-service'
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
  ChatHistoryServiceToken,
  CheckAuthRendererUseCaseToken,
  ClaudeConflictViewModelToken,
  ClaudeExplainViewModelToken,
  ClaudeRepositoryToken,
  ClaudeReviewViewModelToken,
  ClaudeSessionViewModelToken,
  ClaudeStateServiceToken,
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
      .registerSingleton(ClaudeStateServiceToken, ClaudeStateDefaultService)
      .registerSingleton(ChatHistoryServiceToken, ChatHistoryDefaultService, [
        ClaudeRepositoryToken,
        ClaudeStateServiceToken,
      ])
      // 操作系 UseCase
      .registerSingleton(StartSessionRendererUseCaseToken, StartSessionUseCase, [ChatHistoryServiceToken])
      .registerSingleton(StopSessionRendererUseCaseToken, StopSessionUseCase, [ClaudeRepositoryToken])
      .registerSingleton(SendCommandRendererUseCaseToken, SendCommandUseCase, [
        ClaudeRepositoryToken,
        ChatHistoryServiceToken,
        ClaudeStateServiceToken,
      ])
      .registerSingleton(CheckAuthRendererUseCaseToken, CheckAuthUseCase, [ClaudeRepositoryToken])
      .registerSingleton(LoginRendererUseCaseToken, LoginUseCase, [ClaudeRepositoryToken])
      .registerSingleton(LogoutRendererUseCaseToken, LogoutUseCase, [ClaudeRepositoryToken])
      .registerSingleton(GenerateCommitMessageRendererUseCaseToken, GenerateCommitMessageUseCase, [
        ClaudeRepositoryToken,
      ])
      .registerSingleton(ReviewDiffRendererUseCaseToken, ReviewDiffUseCase, [
        ClaudeRepositoryToken,
        ClaudeStateServiceToken,
      ])
      .registerSingleton(ExplainDiffRendererUseCaseToken, ExplainDiffUseCase, [
        ClaudeRepositoryToken,
        ClaudeStateServiceToken,
      ])
      .registerSingleton(ResolveConflictRendererUseCaseToken, ResolveConflictUseCase, [ClaudeRepositoryToken])

    // 状態取得 UseCase: 各 Service の Observable を ObservableQueryUseCase で包む。
    const registerStateQuery = <T>(
      token: InjectionToken<ObservableStoreUseCase<T>>,
      selector: (service: ClaudeStateService) => Observable<T>,
    ): void => {
      container.registerSingleton(
        token,
        () => new ObservableQueryUseCase(selector(container.resolve(ClaudeStateServiceToken))),
      )
    }
    const registerChatQuery = <T>(
      token: InjectionToken<ObservableStoreUseCase<T>>,
      selector: (service: ChatHistoryService) => Observable<T>,
    ): void => {
      container.registerSingleton(
        token,
        () => new ObservableQueryUseCase(selector(container.resolve(ChatHistoryServiceToken))),
      )
    }
    registerStateQuery(GetSessionStatusRendererUseCaseToken, (s) => s.status$)
    registerStateQuery(GetCurrentSessionRendererUseCaseToken, (s) => s.currentSession$)
    registerStateQuery(GetOutputsRendererUseCaseToken, (s) => s.outputs$)
    registerStateQuery(GetIsCommandRunningRendererUseCaseToken, (s) => s.isCommandRunning$)
    registerStateQuery(GetReviewCommentsRendererUseCaseToken, (s) => s.reviewComments$)
    registerStateQuery(GetReviewSummaryRendererUseCaseToken, (s) => s.reviewSummary$)
    registerStateQuery(GetIsReviewingRendererUseCaseToken, (s) => s.isReviewing$)
    registerStateQuery(GetExplanationRendererUseCaseToken, (s) => s.explanation$)
    registerStateQuery(GetIsExplainingRendererUseCaseToken, (s) => s.isExplaining$)
    registerChatQuery(GetChatMessagesRendererUseCaseToken, (s) => s.chatMessages$)
    registerChatQuery(GetConversationsRendererUseCaseToken, (s) => s.conversations$)
    registerChatQuery(GetCurrentConversationIdRendererUseCaseToken, (s) => s.currentConversationId$)

    container
      // ViewModel
      .registerTransient(ClaudeConflictViewModelToken, ClaudeConflictDefaultViewModel, [
        ResolveConflictRendererUseCaseToken,
        ClaudeStateServiceToken,
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
        ChatHistoryServiceToken,
        ClaudeStateServiceToken,
      ])
  },

  setUp: async (container) => {
    const stateService = container.resolve(ClaudeStateServiceToken)
    const chatHistoryService = container.resolve(ChatHistoryServiceToken)
    const repo = container.resolve(ClaudeRepositoryToken)

    stateService.setUp()
    chatHistoryService.setUp()
    await chatHistoryService.loadConversations()

    // 初回認証チェック
    const checkAuthUseCase = container.resolve(CheckAuthRendererUseCaseToken)
    stateService.setAuthChecking(true)
    checkAuthUseCase
      .invoke()
      .then((status) => stateService.setAuthStatus(status))
      .catch(() => stateService.setAuthStatus({ authenticated: false }))
      .finally(() => stateService.setAuthChecking(false))

    const unsubOutput = repo.onOutput((output) => {
      stateService.appendOutput(output)
      if (output.stream === 'stdout') {
        chatHistoryService.appendToLastAssistantMessage(output.content + '\n', output.sessionId)
      }
    })

    const unsubSessionChanged = repo.onSessionChanged((session) => {
      if (session?.claudeSessionId) {
        chatHistoryService.syncClaudeSessionId(session.id, session.claudeSessionId)
      }
      stateService.handleSessionEvent(session, chatHistoryService.getCurrentConversationId())
    })

    const unsubCommandCompleted = repo.onCommandCompleted((data) => {
      chatHistoryService.finalizeLastAssistantMessage(data.sessionId)
      stateService.setCommandRunning(false, data.sessionId, chatHistoryService.getCurrentConversationId())
    })

    const unsubReviewResult = repo.onReviewResult((result) => {
      stateService.setReviewResult(result)
      stateService.setReviewing(false)
    })

    const unsubExplainResult = repo.onExplainResult((result) => {
      stateService.setExplainResult(result)
      stateService.setExplaining(false)
    })

    const unsubConflictResolved = repo.onConflictResolved((result) => {
      stateService.setConflictResult(result)
    })

    return () => {
      unsubOutput()
      unsubSessionChanged()
      unsubCommandCompleted()
      unsubReviewResult()
      unsubExplainResult()
      unsubConflictResolved()
      chatHistoryService.tearDown()
      stateService.tearDown()
    }
  },
}
