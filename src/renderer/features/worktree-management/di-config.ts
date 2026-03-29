import type { VContainerConfig } from '@shared/lib/di'
import { RepositoryServiceToken } from '@renderer/features/application-foundation/di-tokens'
import { WorktreeService } from './application/services/worktree-service'
import { CheckDirtyUseCaseImpl } from './application/usecases/check-dirty-usecase'
import { CreateWorktreeUseCaseImpl } from './application/usecases/create-worktree-usecase'
import { DeleteWorktreeUseCaseImpl } from './application/usecases/delete-worktree-usecase'
import { GetSelectedPathUseCaseImpl } from './application/usecases/get-selected-path-usecase'
import { GetSelectedWorktreeUseCaseImpl } from './application/usecases/get-selected-worktree-usecase'
import { GetWorktreeStatusUseCaseImpl } from './application/usecases/get-worktree-status-usecase'
import { ListWorktreesUseCaseImpl } from './application/usecases/list-worktrees-usecase'
import { RefreshWorktreesUseCaseImpl } from './application/usecases/refresh-worktrees-usecase'
import { SelectWorktreeUseCaseImpl } from './application/usecases/select-worktree-usecase'
import { SetSortOrderUseCaseImpl } from './application/usecases/set-sort-order-usecase'
import { SuggestPathUseCaseImpl } from './application/usecases/suggest-path-usecase'
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
import { WorktreeRepositoryImpl } from './infrastructure/worktree-repository-impl'
import { WorktreeDetailViewModel } from './presentation/worktree-detail-viewmodel'
import { WorktreeListViewModel } from './presentation/worktree-list-viewmodel'

export const worktreeManagementConfig: VContainerConfig = {
  register(container) {
    // 1. Infrastructure (singleton)
    container.registerSingleton(WorktreeRepositoryToken, WorktreeRepositoryImpl)

    // 2. Services (singleton)
    container.registerSingleton(WorktreeServiceToken, WorktreeService)

    // 3. UseCases (singleton, useClass + deps)
    container
      .registerSingleton(ListWorktreesUseCaseToken, ListWorktreesUseCaseImpl, [WorktreeServiceToken])
      .registerSingleton(SelectWorktreeUseCaseToken, SelectWorktreeUseCaseImpl, [WorktreeServiceToken])
      .registerSingleton(CreateWorktreeUseCaseToken, CreateWorktreeUseCaseImpl, [
        WorktreeRepositoryToken,
        WorktreeServiceToken,
      ])
      .registerSingleton(DeleteWorktreeUseCaseToken, DeleteWorktreeUseCaseImpl, [
        WorktreeRepositoryToken,
        WorktreeServiceToken,
      ])
      // RefreshWorktreesUseCase はコールバック引数があるためファクトリー関数
      .registerSingleton(RefreshWorktreesUseCaseToken, () => {
        const repoService = container.resolve(RepositoryServiceToken)
        let currentRepoPath: string | null = null
        repoService.currentRepository$.subscribe((repo) => {
          currentRepoPath = repo?.path ?? null
        })
        return new RefreshWorktreesUseCaseImpl(
          container.resolve(WorktreeRepositoryToken),
          container.resolve(WorktreeServiceToken),
          () => currentRepoPath,
        )
      })
      .registerSingleton(SuggestPathUseCaseToken, SuggestPathUseCaseImpl, [WorktreeRepositoryToken])
      .registerSingleton(CheckDirtyUseCaseToken, CheckDirtyUseCaseImpl, [WorktreeRepositoryToken])
      .registerSingleton(GetSelectedWorktreeUseCaseToken, GetSelectedWorktreeUseCaseImpl, [WorktreeServiceToken])
      .registerSingleton(GetSelectedPathUseCaseToken, GetSelectedPathUseCaseImpl, [WorktreeServiceToken])
      .registerSingleton(SetSortOrderUseCaseToken, SetSortOrderUseCaseImpl, [WorktreeServiceToken])
      .registerSingleton(GetWorktreeStatusUseCaseToken, GetWorktreeStatusUseCaseImpl, [WorktreeRepositoryToken])

    // 4. ViewModels (transient, useClass + deps)
    container
      .registerTransient(WorktreeListViewModelToken, WorktreeListViewModel, [
        ListWorktreesUseCaseToken,
        SelectWorktreeUseCaseToken,
        CreateWorktreeUseCaseToken,
        DeleteWorktreeUseCaseToken,
        RefreshWorktreesUseCaseToken,
        GetSelectedPathUseCaseToken,
        SetSortOrderUseCaseToken,
      ])
      .registerTransient(WorktreeDetailViewModelToken, WorktreeDetailViewModel, [GetSelectedWorktreeUseCaseToken])
  },

  setUp: async (container) => {
    const repo = container.resolve(WorktreeRepositoryToken)
    const service = container.resolve(WorktreeServiceToken)
    const repoService = container.resolve(RepositoryServiceToken)

    service.setUp([])

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
      repoSubscription.unsubscribe()
      unsubscribeChanged()
      service.tearDown()
    }
  },
}
