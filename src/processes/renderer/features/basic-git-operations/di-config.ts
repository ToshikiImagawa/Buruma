import type { VContainerConfig } from '@lib/di'
import { GitOperationsDefaultService } from './application/services/git-operations-service'
import { CheckoutBranchUseCase } from './application/usecases/checkout-branch-usecase'
import { CommitUseCase } from './application/usecases/commit-usecase'
import { CreateBranchUseCase } from './application/usecases/create-branch-usecase'
import { DeleteBranchUseCase } from './application/usecases/delete-branch-usecase'
import { FetchUseCase } from './application/usecases/fetch-usecase'
import { GenerateCommitMessageUseCase } from './application/usecases/generate-commit-message-usecase'
import { GetLastErrorUseCase } from './application/usecases/get-last-error-usecase'
import { GetOperationLoadingUseCase } from './application/usecases/get-operation-loading-usecase'
import { PullUseCase } from './application/usecases/pull-usecase'
import { PushUseCase } from './application/usecases/push-usecase'
import { ResetUseCase } from './application/usecases/reset-usecase'
import { StageAllUseCase } from './application/usecases/stage-all-usecase'
import { StageFilesUseCase } from './application/usecases/stage-files-usecase'
import { UnstageAllUseCase } from './application/usecases/unstage-all-usecase'
import { UnstageFilesUseCase } from './application/usecases/unstage-files-usecase'
import {
  AiAssistRepositoryToken,
  BranchOpsViewModelToken,
  CheckoutBranchRendererUseCaseToken,
  CommitRendererUseCaseToken,
  CommitViewModelToken,
  CreateBranchRendererUseCaseToken,
  DeleteBranchRendererUseCaseToken,
  FetchRendererUseCaseToken,
  GenerateCommitMessageRendererUseCaseToken,
  GetLastErrorUseCaseToken,
  GetOperationLoadingUseCaseToken,
  GitOperationsRepositoryToken,
  GitOperationsServiceToken,
  PullRendererUseCaseToken,
  PushRendererUseCaseToken,
  RemoteOpsViewModelToken,
  ResetRendererUseCaseToken,
  StageAllRendererUseCaseToken,
  StageFilesRendererUseCaseToken,
  StagingViewModelToken,
  UnstageAllRendererUseCaseToken,
  UnstageFilesRendererUseCaseToken,
} from './di-tokens'
import { AiAssistDefaultRepository } from './infrastructure/repositories/ai-assist-default-repository'
import { GitOperationsDefaultRepository } from './infrastructure/repositories/git-operations-default-repository'
import { BranchOpsDefaultViewModel } from './presentation/branch-ops-viewmodel'
import { CommitDefaultViewModel } from './presentation/commit-viewmodel'
import { RemoteOpsDefaultViewModel } from './presentation/remote-ops-viewmodel'
import { StagingDefaultViewModel } from './presentation/staging-viewmodel'

export const basicGitOperationsConfig: VContainerConfig = {
  register(container) {
    // Repository (singleton)
    container.registerSingleton(GitOperationsRepositoryToken, GitOperationsDefaultRepository)
    container.registerSingleton(AiAssistRepositoryToken, AiAssistDefaultRepository)

    // Service (singleton)
    container.registerSingleton(GitOperationsServiceToken, GitOperationsDefaultService)

    // UseCases (singleton)
    container
      .registerSingleton(StageFilesRendererUseCaseToken, StageFilesUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(UnstageFilesRendererUseCaseToken, UnstageFilesUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(StageAllRendererUseCaseToken, StageAllUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(UnstageAllRendererUseCaseToken, UnstageAllUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(CommitRendererUseCaseToken, CommitUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(PushRendererUseCaseToken, PushUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(PullRendererUseCaseToken, PullUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(FetchRendererUseCaseToken, FetchUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(CreateBranchRendererUseCaseToken, CreateBranchUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(CheckoutBranchRendererUseCaseToken, CheckoutBranchUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(DeleteBranchRendererUseCaseToken, DeleteBranchUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])
      .registerSingleton(ResetRendererUseCaseToken, ResetUseCase, [
        GitOperationsRepositoryToken,
        GitOperationsServiceToken,
      ])

    // AI Assist UseCase (singleton)
    container.registerSingleton(GenerateCommitMessageRendererUseCaseToken, GenerateCommitMessageUseCase, [
      AiAssistRepositoryToken,
    ])

    // Observable UseCases (singleton)
    container
      .registerSingleton(GetOperationLoadingUseCaseToken, GetOperationLoadingUseCase, [GitOperationsServiceToken])
      .registerSingleton(GetLastErrorUseCaseToken, GetLastErrorUseCase, [GitOperationsServiceToken])

    // ViewModels (transient)
    container
      .registerTransient(StagingViewModelToken, StagingDefaultViewModel, [
        StageFilesRendererUseCaseToken,
        UnstageFilesRendererUseCaseToken,
        StageAllRendererUseCaseToken,
        UnstageAllRendererUseCaseToken,
        GetOperationLoadingUseCaseToken,
      ])
      .registerTransient(CommitViewModelToken, CommitDefaultViewModel, [
        CommitRendererUseCaseToken,
        GetOperationLoadingUseCaseToken,
        GenerateCommitMessageRendererUseCaseToken,
      ])
      .registerTransient(RemoteOpsViewModelToken, RemoteOpsDefaultViewModel, [
        PushRendererUseCaseToken,
        PullRendererUseCaseToken,
        FetchRendererUseCaseToken,
        GetOperationLoadingUseCaseToken,
        GetLastErrorUseCaseToken,
      ])
      .registerTransient(BranchOpsViewModelToken, BranchOpsDefaultViewModel, [
        CreateBranchRendererUseCaseToken,
        CheckoutBranchRendererUseCaseToken,
        DeleteBranchRendererUseCaseToken,
        ResetRendererUseCaseToken,
        GetOperationLoadingUseCaseToken,
        GetLastErrorUseCaseToken,
      ])
  },

  setUp: async (container) => {
    const service = container.resolve(GitOperationsServiceToken)
    service.setUp()

    return () => {
      service.tearDown()
    }
  },
}
