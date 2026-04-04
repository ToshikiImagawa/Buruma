import type { VContainerConfig } from '@lib/di'
// UseCases
import { MergeUseCase } from './application/usecases/merge-usecase'
import { MergeAbortUseCase } from './application/usecases/merge-abort-usecase'
import { MergeStatusUseCase } from './application/usecases/merge-status-usecase'
import { RebaseUseCase } from './application/usecases/rebase-usecase'
import { RebaseInteractiveUseCase } from './application/usecases/rebase-interactive-usecase'
import { RebaseAbortUseCase } from './application/usecases/rebase-abort-usecase'
import { RebaseContinueUseCase } from './application/usecases/rebase-continue-usecase'
import { GetRebaseCommitsUseCase } from './application/usecases/get-rebase-commits-usecase'
import { StashSaveUseCase } from './application/usecases/stash-save-usecase'
import { StashListUseCase } from './application/usecases/stash-list-usecase'
import { StashPopUseCase } from './application/usecases/stash-pop-usecase'
import { StashApplyUseCase } from './application/usecases/stash-apply-usecase'
import { StashDropUseCase } from './application/usecases/stash-drop-usecase'
import { StashClearUseCase } from './application/usecases/stash-clear-usecase'
import { CherryPickUseCase } from './application/usecases/cherry-pick-usecase'
import { CherryPickAbortUseCase } from './application/usecases/cherry-pick-abort-usecase'
import { ConflictListUseCase } from './application/usecases/conflict-list-usecase'
import { ConflictFileContentUseCase } from './application/usecases/conflict-file-content-usecase'
import { ConflictResolveUseCase } from './application/usecases/conflict-resolve-usecase'
import { ConflictResolveAllUseCase } from './application/usecases/conflict-resolve-all-usecase'
import { ConflictMarkResolvedUseCase } from './application/usecases/conflict-mark-resolved-usecase'
import { TagListUseCase } from './application/usecases/tag-list-usecase'
import { TagCreateUseCase } from './application/usecases/tag-create-usecase'
import { TagDeleteUseCase } from './application/usecases/tag-delete-usecase'
import { GetOperationLoadingUseCase } from './application/usecases/get-operation-loading-usecase'
import { GetLastErrorUseCase } from './application/usecases/get-last-error-usecase'
import { GetOperationProgressUseCase } from './application/usecases/get-operation-progress-usecase'
import { GetCurrentOperationUseCase } from './application/usecases/get-current-operation-usecase'
// ViewModels
import { MergeDefaultViewModel } from './presentation/merge-viewmodel'
import { RebaseDefaultViewModel } from './presentation/rebase-viewmodel'
import { StashDefaultViewModel } from './presentation/stash-viewmodel'
import { CherryPickDefaultViewModel } from './presentation/cherry-pick-viewmodel'
import { ConflictDefaultViewModel } from './presentation/conflict-viewmodel'
import { TagDefaultViewModel } from './presentation/tag-viewmodel'
// Infrastructure
import { AdvancedOperationsDefaultRepository } from './infrastructure/repositories/advanced-operations-default-repository'
import { AdvancedOperationsDefaultService } from './application/services/advanced-operations-service'
// Tokens
import {
  AdvancedOperationsRepositoryToken,
  AdvancedOperationsServiceToken,
  MergeRendererUseCaseToken,
  MergeAbortRendererUseCaseToken,
  MergeStatusRendererUseCaseToken,
  RebaseRendererUseCaseToken,
  RebaseInteractiveRendererUseCaseToken,
  RebaseAbortRendererUseCaseToken,
  RebaseContinueRendererUseCaseToken,
  GetRebaseCommitsRendererUseCaseToken,
  StashSaveRendererUseCaseToken,
  StashListRendererUseCaseToken,
  StashPopRendererUseCaseToken,
  StashApplyRendererUseCaseToken,
  StashDropRendererUseCaseToken,
  StashClearRendererUseCaseToken,
  CherryPickRendererUseCaseToken,
  CherryPickAbortRendererUseCaseToken,
  ConflictListRendererUseCaseToken,
  ConflictFileContentRendererUseCaseToken,
  ConflictResolveRendererUseCaseToken,
  ConflictResolveAllRendererUseCaseToken,
  ConflictMarkResolvedRendererUseCaseToken,
  TagListRendererUseCaseToken,
  TagCreateRendererUseCaseToken,
  TagDeleteRendererUseCaseToken,
  GetAdvancedOperationLoadingUseCaseToken,
  GetAdvancedLastErrorUseCaseToken,
  GetAdvancedOperationProgressUseCaseToken,
  GetAdvancedCurrentOperationUseCaseToken,
  MergeViewModelToken,
  RebaseViewModelToken,
  StashViewModelToken,
  CherryPickViewModelToken,
  ConflictViewModelToken,
  TagViewModelToken,
} from './di-tokens'

const REPO_AND_SERVICE = [AdvancedOperationsRepositoryToken, AdvancedOperationsServiceToken]

export const advancedGitOperationsConfig: VContainerConfig = {
  register(container) {
    // Repository
    container.registerSingleton(
      AdvancedOperationsRepositoryToken,
      AdvancedOperationsDefaultRepository,
    )

    // Service
    container.registerSingleton(AdvancedOperationsServiceToken, AdvancedOperationsDefaultService)

    // --- 操作系 UseCases ---
    container
      // マージ
      .registerSingleton(MergeRendererUseCaseToken, MergeUseCase, REPO_AND_SERVICE)
      .registerSingleton(MergeAbortRendererUseCaseToken, MergeAbortUseCase, REPO_AND_SERVICE)
      .registerSingleton(MergeStatusRendererUseCaseToken, MergeStatusUseCase, REPO_AND_SERVICE)
      // リベース
      .registerSingleton(RebaseRendererUseCaseToken, RebaseUseCase, REPO_AND_SERVICE)
      .registerSingleton(
        RebaseInteractiveRendererUseCaseToken,
        RebaseInteractiveUseCase,
        REPO_AND_SERVICE,
      )
      .registerSingleton(RebaseAbortRendererUseCaseToken, RebaseAbortUseCase, REPO_AND_SERVICE)
      .registerSingleton(
        RebaseContinueRendererUseCaseToken,
        RebaseContinueUseCase,
        REPO_AND_SERVICE,
      )
      .registerSingleton(
        GetRebaseCommitsRendererUseCaseToken,
        GetRebaseCommitsUseCase,
        REPO_AND_SERVICE,
      )
      // スタッシュ
      .registerSingleton(StashSaveRendererUseCaseToken, StashSaveUseCase, REPO_AND_SERVICE)
      .registerSingleton(StashListRendererUseCaseToken, StashListUseCase, REPO_AND_SERVICE)
      .registerSingleton(StashPopRendererUseCaseToken, StashPopUseCase, REPO_AND_SERVICE)
      .registerSingleton(StashApplyRendererUseCaseToken, StashApplyUseCase, REPO_AND_SERVICE)
      .registerSingleton(StashDropRendererUseCaseToken, StashDropUseCase, REPO_AND_SERVICE)
      .registerSingleton(StashClearRendererUseCaseToken, StashClearUseCase, REPO_AND_SERVICE)
      // チェリーピック
      .registerSingleton(CherryPickRendererUseCaseToken, CherryPickUseCase, REPO_AND_SERVICE)
      .registerSingleton(
        CherryPickAbortRendererUseCaseToken,
        CherryPickAbortUseCase,
        REPO_AND_SERVICE,
      )
      // コンフリクト解決
      .registerSingleton(ConflictListRendererUseCaseToken, ConflictListUseCase, REPO_AND_SERVICE)
      .registerSingleton(
        ConflictFileContentRendererUseCaseToken,
        ConflictFileContentUseCase,
        REPO_AND_SERVICE,
      )
      .registerSingleton(
        ConflictResolveRendererUseCaseToken,
        ConflictResolveUseCase,
        REPO_AND_SERVICE,
      )
      .registerSingleton(
        ConflictResolveAllRendererUseCaseToken,
        ConflictResolveAllUseCase,
        REPO_AND_SERVICE,
      )
      .registerSingleton(
        ConflictMarkResolvedRendererUseCaseToken,
        ConflictMarkResolvedUseCase,
        REPO_AND_SERVICE,
      )
      // タグ
      .registerSingleton(TagListRendererUseCaseToken, TagListUseCase, REPO_AND_SERVICE)
      .registerSingleton(TagCreateRendererUseCaseToken, TagCreateUseCase, REPO_AND_SERVICE)
      .registerSingleton(TagDeleteRendererUseCaseToken, TagDeleteUseCase, REPO_AND_SERVICE)

    // --- Observable UseCases ---
    container
      .registerSingleton(GetAdvancedOperationLoadingUseCaseToken, GetOperationLoadingUseCase, [
        AdvancedOperationsServiceToken,
      ])
      .registerSingleton(GetAdvancedLastErrorUseCaseToken, GetLastErrorUseCase, [
        AdvancedOperationsServiceToken,
      ])
      .registerSingleton(GetAdvancedOperationProgressUseCaseToken, GetOperationProgressUseCase, [
        AdvancedOperationsServiceToken,
      ])
      .registerSingleton(GetAdvancedCurrentOperationUseCaseToken, GetCurrentOperationUseCase, [
        AdvancedOperationsServiceToken,
      ])

    // --- ViewModels (transient) ---
    container
      .registerTransient(MergeViewModelToken, MergeDefaultViewModel, [
        MergeRendererUseCaseToken,
        MergeAbortRendererUseCaseToken,
        MergeStatusRendererUseCaseToken,
        GetAdvancedOperationLoadingUseCaseToken,
      ])
      .registerTransient(RebaseViewModelToken, RebaseDefaultViewModel, [
        RebaseRendererUseCaseToken,
        RebaseInteractiveRendererUseCaseToken,
        RebaseAbortRendererUseCaseToken,
        RebaseContinueRendererUseCaseToken,
        GetRebaseCommitsRendererUseCaseToken,
        GetAdvancedOperationLoadingUseCaseToken,
      ])
      .registerTransient(StashViewModelToken, StashDefaultViewModel, [
        StashSaveRendererUseCaseToken,
        StashListRendererUseCaseToken,
        StashPopRendererUseCaseToken,
        StashApplyRendererUseCaseToken,
        StashDropRendererUseCaseToken,
        StashClearRendererUseCaseToken,
        GetAdvancedOperationLoadingUseCaseToken,
      ])
      .registerTransient(CherryPickViewModelToken, CherryPickDefaultViewModel, [
        CherryPickRendererUseCaseToken,
        CherryPickAbortRendererUseCaseToken,
        GetAdvancedOperationLoadingUseCaseToken,
      ])
      .registerTransient(ConflictViewModelToken, ConflictDefaultViewModel, [
        ConflictListRendererUseCaseToken,
        ConflictFileContentRendererUseCaseToken,
        ConflictResolveRendererUseCaseToken,
        ConflictResolveAllRendererUseCaseToken,
        ConflictMarkResolvedRendererUseCaseToken,
        GetAdvancedOperationLoadingUseCaseToken,
      ])
      .registerTransient(TagViewModelToken, TagDefaultViewModel, [
        TagListRendererUseCaseToken,
        TagCreateRendererUseCaseToken,
        TagDeleteRendererUseCaseToken,
        GetAdvancedOperationLoadingUseCaseToken,
      ])
  },

  setUp: async (container) => {
    const service = container.resolve(AdvancedOperationsServiceToken)
    service.setUp()
    return () => {
      service.tearDown()
    }
  },
}
