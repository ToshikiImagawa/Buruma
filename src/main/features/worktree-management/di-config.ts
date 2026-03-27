import type { VContainerConfig } from '@shared/lib/di'
import { CheckDirtyMainUseCase } from './application/usecases/check-dirty-main-usecase'
import { CreateWorktreeMainUseCase } from './application/usecases/create-worktree-main-usecase'
import { DeleteWorktreeMainUseCase } from './application/usecases/delete-worktree-main-usecase'
import { GetDefaultBranchMainUseCase } from './application/usecases/get-default-branch-main-usecase'
import { GetWorktreeStatusMainUseCase } from './application/usecases/get-worktree-status-main-usecase'
import { ListWorktreesMainUseCase } from './application/usecases/list-worktrees-main-usecase'
import { SuggestPathMainUseCase } from './application/usecases/suggest-path-main-usecase'
import {
  CheckDirtyMainUseCaseToken,
  CreateWorktreeMainUseCaseToken,
  DeleteWorktreeMainUseCaseToken,
  GetDefaultBranchMainUseCaseToken,
  GetWorktreeStatusMainUseCaseToken,
  ListWorktreesMainUseCaseToken,
  SuggestPathMainUseCaseToken,
  WorktreeGitServiceToken,
  WorktreeWatcherToken,
} from './di-tokens'
import { WorktreeGitService } from './infrastructure/worktree-git-service'
import { WorktreeWatcher } from './infrastructure/worktree-watcher'
import { registerIPCHandlers } from './presentation/ipc-handlers'

export const worktreeManagementMainConfig: VContainerConfig = {
  register(container) {
    // Infrastructure (singleton)
    container
      .registerSingleton(WorktreeGitServiceToken, () => new WorktreeGitService())
      .registerSingleton(WorktreeWatcherToken, () => new WorktreeWatcher())

    // Application UseCases (singleton)
    const resolveGit = () => container.resolve(WorktreeGitServiceToken)
    container
      .registerSingleton(ListWorktreesMainUseCaseToken, () => new ListWorktreesMainUseCase(resolveGit()))
      .registerSingleton(GetWorktreeStatusMainUseCaseToken, () => new GetWorktreeStatusMainUseCase(resolveGit()))
      .registerSingleton(CreateWorktreeMainUseCaseToken, () => new CreateWorktreeMainUseCase(resolveGit()))
      .registerSingleton(DeleteWorktreeMainUseCaseToken, () => new DeleteWorktreeMainUseCase(resolveGit()))
      .registerSingleton(SuggestPathMainUseCaseToken, () => new SuggestPathMainUseCase(resolveGit()))
      .registerSingleton(CheckDirtyMainUseCaseToken, () => new CheckDirtyMainUseCase(resolveGit()))
      .registerSingleton(GetDefaultBranchMainUseCaseToken, () => new GetDefaultBranchMainUseCase(resolveGit()))
  },

  setUp: async (container) => {
    const watcher = container.resolve(WorktreeWatcherToken)

    registerIPCHandlers(
      container.resolve(ListWorktreesMainUseCaseToken),
      container.resolve(GetWorktreeStatusMainUseCaseToken),
      container.resolve(CreateWorktreeMainUseCaseToken),
      container.resolve(DeleteWorktreeMainUseCaseToken),
      container.resolve(SuggestPathMainUseCaseToken),
      container.resolve(CheckDirtyMainUseCaseToken),
      container.resolve(GetDefaultBranchMainUseCaseToken),
    )

    return () => {
      watcher.stop()
    }
  },
}
