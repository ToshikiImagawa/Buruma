import type { VContainerConfig } from '@shared/lib/di'
import { RepositoryServiceToken } from '@renderer/features/application-foundation/di-tokens'
import { CheckDirtyUseCaseImpl } from './application/usecases/check-dirty-usecase'
import { CreateWorktreeUseCaseImpl } from './application/usecases/create-worktree-usecase'
import { DeleteWorktreeUseCaseImpl } from './application/usecases/delete-worktree-usecase'
import { GetSelectedWorktreeUseCaseImpl } from './application/usecases/get-selected-worktree-usecase'
import { GetWorktreeStatusUseCaseImpl } from './application/usecases/get-worktree-status-usecase'
import { ListWorktreesUseCaseImpl } from './application/usecases/list-worktrees-usecase'
import { RefreshWorktreesUseCaseImpl } from './application/usecases/refresh-worktrees-usecase'
import { SelectWorktreeUseCaseImpl } from './application/usecases/select-worktree-usecase'
import { SuggestPathUseCaseImpl } from './application/usecases/suggest-path-usecase'
import { WorktreeService } from './application/worktree-service'
import {
  CheckDirtyUseCaseToken,
  CreateWorktreeUseCaseToken,
  DeleteWorktreeUseCaseToken,
  GetSelectedWorktreeUseCaseToken,
  GetWorktreeStatusUseCaseToken,
  ListWorktreesUseCaseToken,
  RefreshWorktreesUseCaseToken,
  SelectWorktreeUseCaseToken,
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

    // 3. UseCases (singleton)
    container
      .registerSingleton(
        ListWorktreesUseCaseToken,
        () => new ListWorktreesUseCaseImpl(container.resolve(WorktreeServiceToken)),
      )
      .registerSingleton(
        SelectWorktreeUseCaseToken,
        () => new SelectWorktreeUseCaseImpl(container.resolve(WorktreeServiceToken)),
      )
      .registerSingleton(
        CreateWorktreeUseCaseToken,
        () =>
          new CreateWorktreeUseCaseImpl(
            container.resolve(WorktreeRepositoryToken),
            container.resolve(WorktreeServiceToken),
          ),
      )
      .registerSingleton(
        DeleteWorktreeUseCaseToken,
        () =>
          new DeleteWorktreeUseCaseImpl(
            container.resolve(WorktreeRepositoryToken),
            container.resolve(WorktreeServiceToken),
          ),
      )
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
      .registerSingleton(
        SuggestPathUseCaseToken,
        () => new SuggestPathUseCaseImpl(container.resolve(WorktreeRepositoryToken)),
      )
      .registerSingleton(
        CheckDirtyUseCaseToken,
        () => new CheckDirtyUseCaseImpl(container.resolve(WorktreeRepositoryToken)),
      )
      .registerSingleton(
        GetSelectedWorktreeUseCaseToken,
        () => new GetSelectedWorktreeUseCaseImpl(container.resolve(WorktreeServiceToken)),
      )
      .registerSingleton(
        GetWorktreeStatusUseCaseToken,
        () => new GetWorktreeStatusUseCaseImpl(container.resolve(WorktreeRepositoryToken)),
      )

    // 4. ViewModels (transient)
    container
      .registerTransient(
        WorktreeListViewModelToken,
        () =>
          new WorktreeListViewModel(
            container.resolve(ListWorktreesUseCaseToken),
            container.resolve(SelectWorktreeUseCaseToken),
            container.resolve(CreateWorktreeUseCaseToken),
            container.resolve(DeleteWorktreeUseCaseToken),
            container.resolve(RefreshWorktreesUseCaseToken),
            container.resolve(WorktreeServiceToken),
          ),
      )
      .registerTransient(
        WorktreeDetailViewModelToken,
        () =>
          new WorktreeDetailViewModel(
            container.resolve(GetSelectedWorktreeUseCaseToken),
            container.resolve(GetWorktreeStatusUseCaseToken),
          ),
      )
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
