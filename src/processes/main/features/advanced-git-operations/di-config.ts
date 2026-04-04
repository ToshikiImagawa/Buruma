import type { VContainerConfig } from '@lib/di'
import { BrowserWindow } from 'electron'
import { MergeUseCase } from './application/usecases/merge-usecase'
import { MergeAbortUseCase } from './application/usecases/merge-abort-usecase'
import { MergeStatusUseCase } from './application/usecases/merge-status-usecase'
import { ConflictListUseCase } from './application/usecases/conflict-list-usecase'
import { ConflictFileContentUseCase } from './application/usecases/conflict-file-content-usecase'
import { ConflictResolveUseCase } from './application/usecases/conflict-resolve-usecase'
import { ConflictResolveAllUseCase } from './application/usecases/conflict-resolve-all-usecase'
import { ConflictMarkResolvedUseCase } from './application/usecases/conflict-mark-resolved-usecase'
import {
  GitAdvancedRepositoryToken,
  MergeMainUseCaseToken,
  MergeAbortMainUseCaseToken,
  MergeStatusMainUseCaseToken,
  ConflictListMainUseCaseToken,
  ConflictFileContentMainUseCaseToken,
  ConflictResolveMainUseCaseToken,
  ConflictResolveAllMainUseCaseToken,
  ConflictMarkResolvedMainUseCaseToken,
} from './di-tokens'
import { GitAdvancedDefaultRepository } from './infrastructure/repositories/git-advanced-default-repository'
import { registerGitAdvancedIPCHandlers } from './presentation/ipc-handlers'

export const advancedGitOperationsMainConfig: VContainerConfig = {
  register(container) {
    // Repository (singleton)
    container.registerSingleton(GitAdvancedRepositoryToken, GitAdvancedDefaultRepository)

    // Application UseCases (singleton, deps で依存関係を宣言)
    container
      .registerSingleton(MergeMainUseCaseToken, MergeUseCase, [GitAdvancedRepositoryToken])
      .registerSingleton(MergeAbortMainUseCaseToken, MergeAbortUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(MergeStatusMainUseCaseToken, MergeStatusUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(ConflictListMainUseCaseToken, ConflictListUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(ConflictFileContentMainUseCaseToken, ConflictFileContentUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(ConflictResolveMainUseCaseToken, ConflictResolveUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(ConflictResolveAllMainUseCaseToken, ConflictResolveAllUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(ConflictMarkResolvedMainUseCaseToken, ConflictMarkResolvedUseCase, [
        GitAdvancedRepositoryToken,
      ])
  },

  setUp: async (container) => {
    // 進捗フィードバック: GitAdvancedDefaultRepository に BrowserWindow 経由の通知を注入
    const repo = container.resolve(GitAdvancedRepositoryToken) as GitAdvancedDefaultRepository
    repo.setProgressCallback((event) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send('git:progress', event)
      }
    })

    const unregisterHandlers = registerGitAdvancedIPCHandlers(
      container.resolve(MergeMainUseCaseToken),
      container.resolve(MergeAbortMainUseCaseToken),
      container.resolve(MergeStatusMainUseCaseToken),
      container.resolve(ConflictListMainUseCaseToken),
      container.resolve(ConflictFileContentMainUseCaseToken),
      container.resolve(ConflictResolveMainUseCaseToken),
      container.resolve(ConflictResolveAllMainUseCaseToken),
      container.resolve(ConflictMarkResolvedMainUseCaseToken),
    )

    return () => {
      unregisterHandlers()
    }
  },
}
