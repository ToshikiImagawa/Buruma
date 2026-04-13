import type { VContainerConfig } from '@lib/di'
import { ObserveAdvancedOperationCompletedUseCaseToken } from '@/features/advanced-git-operations/di-tokens'
import { ObserveOperationCompletedUseCaseToken as BasicObserveOperationCompletedUseCaseToken } from '@/features/basic-git-operations/di-tokens'
import { RepositoryViewerDefaultService } from './application/services/repository-viewer-service'
import { GetBranchesUseCase } from './application/usecases/get-branches-usecase'
import { GetCommitDetailUseCase } from './application/usecases/get-commit-detail-usecase'
import { GetDiffCommitUseCase } from './application/usecases/get-diff-commit-usecase'
import { GetDiffStagedUseCase } from './application/usecases/get-diff-staged-usecase'
import { GetDiffUseCase } from './application/usecases/get-diff-usecase'
import { GetFileContentsCommitUseCase } from './application/usecases/get-file-contents-commit-usecase'
import { GetFileContentsUseCase } from './application/usecases/get-file-contents-usecase'
import { GetFileTreeUseCase } from './application/usecases/get-file-tree-usecase'
import { GetLogUseCase } from './application/usecases/get-log-usecase'
import { GetStatusUseCase } from './application/usecases/get-status-usecase'
import {
  BranchListViewModelToken,
  CommitLogViewModelToken,
  DiffViewViewModelToken,
  FileTreeViewModelToken,
  GetBranchesUseCaseToken,
  GetCommitDetailUseCaseToken,
  GetDiffCommitUseCaseToken,
  GetDiffStagedUseCaseToken,
  GetDiffUseCaseToken,
  GetFileContentsCommitUseCaseToken,
  GetFileContentsUseCaseToken,
  GetFileTreeUseCaseToken,
  GetLogUseCaseToken,
  GetStatusUseCaseToken,
  GitRefreshCoordinatorViewModelToken,
  GitViewerRepositoryToken,
  RepositoryViewerServiceToken,
  StatusViewModelToken,
} from './di-tokens'
import { GitViewerDefaultRepository } from './infrastructure/repositories/git-viewer-default-repository'
import { BranchListDefaultViewModel } from './presentation/branch-list-viewmodel'
import { CommitLogDefaultViewModel } from './presentation/commit-log-viewmodel'
import { DiffViewDefaultViewModel } from './presentation/diff-view-viewmodel'
import { FileTreeDefaultViewModel } from './presentation/file-tree-viewmodel'
import { GitRefreshCoordinatorDefaultViewModel } from './presentation/git-refresh-coordinator-viewmodel'
import { StatusDefaultViewModel } from './presentation/status-viewmodel'

export const repositoryViewerConfig: VContainerConfig = {
  register(container) {
    // Repository (singleton)
    container.registerSingleton(GitViewerRepositoryToken, GitViewerDefaultRepository)

    // Service (singleton)
    container.registerSingleton(RepositoryViewerServiceToken, RepositoryViewerDefaultService)

    // UseCases (singleton)
    container
      .registerSingleton(GetStatusUseCaseToken, GetStatusUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetLogUseCaseToken, GetLogUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetCommitDetailUseCaseToken, GetCommitDetailUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetDiffUseCaseToken, GetDiffUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetDiffStagedUseCaseToken, GetDiffStagedUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetDiffCommitUseCaseToken, GetDiffCommitUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetBranchesUseCaseToken, GetBranchesUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetFileTreeUseCaseToken, GetFileTreeUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetFileContentsUseCaseToken, GetFileContentsUseCase, [GitViewerRepositoryToken])
      .registerSingleton(GetFileContentsCommitUseCaseToken, GetFileContentsCommitUseCase, [GitViewerRepositoryToken])

    // ViewModels (transient)
    container
      .registerTransient(StatusViewModelToken, StatusDefaultViewModel, [
        GetStatusUseCaseToken,
        RepositoryViewerServiceToken,
      ])
      .registerTransient(CommitLogViewModelToken, CommitLogDefaultViewModel, [
        GetLogUseCaseToken,
        GetCommitDetailUseCaseToken,
        RepositoryViewerServiceToken,
      ])
      .registerTransient(DiffViewViewModelToken, DiffViewDefaultViewModel, [
        GetDiffUseCaseToken,
        GetDiffStagedUseCaseToken,
        GetDiffCommitUseCaseToken,
        RepositoryViewerServiceToken,
      ])
      .registerTransient(BranchListViewModelToken, BranchListDefaultViewModel, [
        GetBranchesUseCaseToken,
        RepositoryViewerServiceToken,
      ])
      .registerTransient(FileTreeViewModelToken, FileTreeDefaultViewModel, [
        GetFileTreeUseCaseToken,
        RepositoryViewerServiceToken,
      ])
      .registerTransient(GitRefreshCoordinatorViewModelToken, GitRefreshCoordinatorDefaultViewModel, [
        BasicObserveOperationCompletedUseCaseToken,
        ObserveAdvancedOperationCompletedUseCaseToken,
      ])
  },

  setUp: async (container) => {
    const service = container.resolve(RepositoryViewerServiceToken)
    service.setUp()

    return () => {
      service.tearDown()
    }
  },
}
