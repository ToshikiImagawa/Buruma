import type { VContainerConfig } from '@shared/lib/di'
import type { WorktreeInfo } from '@shared/domain'
import {
  WorktreeRepositoryToken,
  WorktreeServiceToken,
  ListWorktreesUseCaseToken,
  SelectWorktreeUseCaseToken,
  CreateWorktreeUseCaseToken,
  DeleteWorktreeUseCaseToken,
  RefreshWorktreesUseCaseToken,
  SuggestPathUseCaseToken,
  CheckDirtyUseCaseToken,
  GetSelectedWorktreeUseCaseToken,
  GetWorktreeStatusUseCaseToken,
  WorktreeListViewModelToken,
  WorktreeDetailViewModelToken,
} from './di-tokens'
import { WorktreeRepositoryImpl } from './infrastructure/worktree-repository-impl'
import { WorktreeService } from './application/worktree-service'
import { ListWorktreesUseCaseImpl } from './application/usecases/list-worktrees-usecase'
import { SelectWorktreeUseCaseImpl } from './application/usecases/select-worktree-usecase'
import { CreateWorktreeUseCaseImpl } from './application/usecases/create-worktree-usecase'
import { DeleteWorktreeUseCaseImpl } from './application/usecases/delete-worktree-usecase'
import { RefreshWorktreesUseCaseImpl } from './application/usecases/refresh-worktrees-usecase'
import { SuggestPathUseCaseImpl } from './application/usecases/suggest-path-usecase'
import { CheckDirtyUseCaseImpl } from './application/usecases/check-dirty-usecase'
import { GetSelectedWorktreeUseCaseImpl } from './application/usecases/get-selected-worktree-usecase'
import { GetWorktreeStatusUseCaseImpl } from './application/usecases/get-worktree-status-usecase'
import { WorktreeListViewModel } from './presentation/worktree-list-viewmodel'
import { WorktreeDetailViewModel } from './presentation/worktree-detail-viewmodel'

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
      .registerSingleton(
        RefreshWorktreesUseCaseToken,
        () =>
          new RefreshWorktreesUseCaseImpl(
            container.resolve(WorktreeRepositoryToken),
            container.resolve(WorktreeServiceToken),
            () => null, // TODO: application-foundation の RepositoryService から repoPath を取得
          ),
      )
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

    const initialWorktrees: WorktreeInfo[] = []
    service.setUp(initialWorktrees)

    const unsubscribe = repo.onChanged(() => {
      const refreshUseCase = container.resolve(RefreshWorktreesUseCaseToken)
      refreshUseCase.invoke()
    })

    return () => {
      unsubscribe()
      service.tearDown()
    }
  },
}
