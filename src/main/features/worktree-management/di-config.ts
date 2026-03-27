import type { VContainerConfig } from '@shared/lib/di'
import { WorktreeMainUseCase } from './application/worktree-main-usecase'
import { WorktreeGitServiceToken, WorktreeMainUseCaseToken, WorktreeWatcherToken } from './di-tokens'
import { WorktreeGitService } from './infrastructure/worktree-git-service'
import { WorktreeWatcher } from './infrastructure/worktree-watcher'
import { registerIPCHandlers } from './presentation/ipc-handlers'

export const worktreeManagementMainConfig: VContainerConfig = {
  register(container) {
    container
      .registerSingleton(WorktreeGitServiceToken, () => new WorktreeGitService())
      .registerSingleton(WorktreeWatcherToken, () => new WorktreeWatcher())

    container.registerSingleton(
      WorktreeMainUseCaseToken,
      () => new WorktreeMainUseCase(container.resolve(WorktreeGitServiceToken)),
    )
  },

  setUp: async (container) => {
    const useCase = container.resolve(WorktreeMainUseCaseToken)
    const watcher = container.resolve(WorktreeWatcherToken)

    registerIPCHandlers(useCase)

    return () => {
      watcher.stop()
    }
  },
}
