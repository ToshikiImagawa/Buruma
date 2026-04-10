import type { VContainerConfig } from '@lib/di'
import { RepositoryServiceToken } from '@/features/application-foundation/di-tokens'
import { WorktreeDefaultService } from './application/services/worktree-service'
import { CheckDirtyDefaultUseCase } from './application/usecases/check-dirty-usecase'
import { CreateWorktreeDefaultUseCase } from './application/usecases/create-worktree-usecase'
import { DeleteWorktreeDefaultUseCase } from './application/usecases/delete-worktree-usecase'
import { GetSelectedPathDefaultUseCase } from './application/usecases/get-selected-path-usecase'
import { GetSelectedWorktreeDefaultUseCase } from './application/usecases/get-selected-worktree-usecase'
import { GetWorktreeStatusDefaultUseCase } from './application/usecases/get-worktree-status-usecase'
import { ListWorktreesDefaultUseCase } from './application/usecases/list-worktrees-usecase'
import { RefreshWorktreesDefaultUseCase } from './application/usecases/refresh-worktrees-usecase'
import { SelectWorktreeDefaultUseCase } from './application/usecases/select-worktree-usecase'
import { SetSortOrderDefaultUseCase } from './application/usecases/set-sort-order-usecase'
import { SuggestPathDefaultUseCase } from './application/usecases/suggest-path-usecase'
import {
  CheckDirtyUseCaseToken,
  CreateWorktreeUseCaseToken,
  DeleteWorktreeUseCaseToken,
  GetSelectedPathUseCaseToken,
  GetSelectedWorktreeUseCaseToken,
  GetWorktreeStatusUseCaseToken,
  ListWorktreesUseCaseToken,
  RefreshWorktreesUseCaseToken,
  SelectWorktreeUseCaseToken,
  SetSortOrderUseCaseToken,
  SuggestPathUseCaseToken,
  WorktreeDetailViewModelToken,
  WorktreeListViewModelToken,
  WorktreeRepositoryToken,
  WorktreeServiceToken,
} from './di-tokens'
import { WorktreeDefaultRepository } from './infrastructure/repositories/worktree-default-repository'
import { WorktreeDetailDefaultViewModel } from './presentation/worktree-detail-viewmodel'
import { WorktreeListDefaultViewModel } from './presentation/worktree-list-viewmodel'

let currentRepoPath: string | null = null

export const worktreeManagementConfig: VContainerConfig = {
  register(container) {
    // 1. Infrastructure (singleton)
    container.registerSingleton(WorktreeRepositoryToken, WorktreeDefaultRepository)

    // 2. Services (singleton)
    container.registerSingleton(WorktreeServiceToken, WorktreeDefaultService)

    // 3. UseCases (singleton, useClass + deps)
    container
      .registerSingleton(ListWorktreesUseCaseToken, ListWorktreesDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(SelectWorktreeUseCaseToken, SelectWorktreeDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(CreateWorktreeUseCaseToken, CreateWorktreeDefaultUseCase, [
        WorktreeRepositoryToken,
        WorktreeServiceToken,
      ])
      .registerSingleton(DeleteWorktreeUseCaseToken, DeleteWorktreeDefaultUseCase, [
        WorktreeRepositoryToken,
        WorktreeServiceToken,
      ])
      // RefreshWorktreesUseCase はコールバック引数があるためファクトリー関数
      .registerSingleton(
        RefreshWorktreesUseCaseToken,
        () =>
          new RefreshWorktreesDefaultUseCase(
            container.resolve(WorktreeRepositoryToken),
            container.resolve(WorktreeServiceToken),
            () => currentRepoPath,
          ),
      )
      .registerSingleton(SuggestPathUseCaseToken, SuggestPathDefaultUseCase, [WorktreeRepositoryToken])
      .registerSingleton(CheckDirtyUseCaseToken, CheckDirtyDefaultUseCase, [WorktreeRepositoryToken])
      .registerSingleton(GetSelectedWorktreeUseCaseToken, GetSelectedWorktreeDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(GetSelectedPathUseCaseToken, GetSelectedPathDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(SetSortOrderUseCaseToken, SetSortOrderDefaultUseCase, [WorktreeServiceToken])
      .registerSingleton(GetWorktreeStatusUseCaseToken, GetWorktreeStatusDefaultUseCase, [WorktreeRepositoryToken])

    // 4. ViewModels (transient, useClass + deps)
    container
      .registerTransient(WorktreeListViewModelToken, WorktreeListDefaultViewModel, [
        ListWorktreesUseCaseToken,
        SelectWorktreeUseCaseToken,
        CreateWorktreeUseCaseToken,
        DeleteWorktreeUseCaseToken,
        RefreshWorktreesUseCaseToken,
        GetSelectedPathUseCaseToken,
        SetSortOrderUseCaseToken,
      ])
      .registerTransient(WorktreeDetailViewModelToken, WorktreeDetailDefaultViewModel, [
        GetSelectedWorktreeUseCaseToken,
      ])
  },

  setUp: async (container) => {
    const repo = container.resolve(WorktreeRepositoryToken)
    const service = container.resolve(WorktreeServiceToken)
    const repoService = container.resolve(RepositoryServiceToken)

    service.setUp([])

    // RefreshWorktreesUseCase 用の repoPath 追跡
    const repoPathSubscription = repoService.currentRepository$.subscribe((repo) => {
      currentRepoPath = repo?.path ?? null
    })

    // リポジトリ変更時にワークツリー一覧を読み込む
    const repoSubscription = repoService.currentRepository$.subscribe((currentRepo) => {
      if (currentRepo) {
        repo
          .list(currentRepo.path)
          .then((worktrees) => service.updateWorktrees(worktrees))
          .catch(() => service.updateWorktrees([]))
      } else {
        service.updateWorktrees([])
      }
    })

    // worktree:changed イベントの購読（リアルタイム更新）
    const unsubscribeChanged = repo.onChanged(() => {
      const refreshUseCase = container.resolve(RefreshWorktreesUseCaseToken)
      refreshUseCase.invoke()
    })

    return () => {
      repoPathSubscription.unsubscribe()
      repoSubscription.unsubscribe()
      unsubscribeChanged()
      currentRepoPath = null
      service.tearDown()
    }
  },
}
