import type { VContainerConfig } from '@lib/di'
import { GetBranchesMainUseCase } from './application/usecases/get-branches-main-usecase'
import { GetCommitDetailMainUseCase } from './application/usecases/get-commit-detail-main-usecase'
import { GetDiffCommitMainUseCase } from './application/usecases/get-diff-commit-main-usecase'
import { GetDiffMainUseCase } from './application/usecases/get-diff-main-usecase'
import { GetDiffStagedMainUseCase } from './application/usecases/get-diff-staged-main-usecase'
import { GetFileContentsCommitMainUseCase } from './application/usecases/get-file-contents-commit-main-usecase'
import { GetFileContentsMainUseCase } from './application/usecases/get-file-contents-main-usecase'
import { GetFileTreeMainUseCase } from './application/usecases/get-file-tree-main-usecase'
import { GetLogMainUseCase } from './application/usecases/get-log-main-usecase'
import { GetStatusMainUseCase } from './application/usecases/get-status-main-usecase'
import {
  GetBranchesMainUseCaseToken,
  GetCommitDetailMainUseCaseToken,
  GetDiffCommitMainUseCaseToken,
  GetDiffMainUseCaseToken,
  GetDiffStagedMainUseCaseToken,
  GetFileContentsCommitMainUseCaseToken,
  GetFileContentsMainUseCaseToken,
  GetFileTreeMainUseCaseToken,
  GetLogMainUseCaseToken,
  GetStatusMainUseCaseToken,
  GitReadRepositoryToken,
} from './di-tokens'
import { GitReadDefaultRepository } from './infrastructure/repositories/git-read-default-repository'
import { registerGitIPCHandlers } from './presentation/ipc-handlers'

export const repositoryViewerMainConfig: VContainerConfig = {
  register(container) {
    // Repository (singleton)
    container.registerSingleton(GitReadRepositoryToken, GitReadDefaultRepository)

    // Application UseCases (singleton, deps で依存関係を宣言)
    container
      .registerSingleton(GetStatusMainUseCaseToken, GetStatusMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetLogMainUseCaseToken, GetLogMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetCommitDetailMainUseCaseToken, GetCommitDetailMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetDiffMainUseCaseToken, GetDiffMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetDiffStagedMainUseCaseToken, GetDiffStagedMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetDiffCommitMainUseCaseToken, GetDiffCommitMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetBranchesMainUseCaseToken, GetBranchesMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetFileTreeMainUseCaseToken, GetFileTreeMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetFileContentsMainUseCaseToken, GetFileContentsMainUseCase, [GitReadRepositoryToken])
      .registerSingleton(GetFileContentsCommitMainUseCaseToken, GetFileContentsCommitMainUseCase, [
        GitReadRepositoryToken,
      ])
  },

  setUp: async (container) => {
    const unregisterHandlers = registerGitIPCHandlers(
      container.resolve(GetStatusMainUseCaseToken),
      container.resolve(GetLogMainUseCaseToken),
      container.resolve(GetCommitDetailMainUseCaseToken),
      container.resolve(GetDiffMainUseCaseToken),
      container.resolve(GetDiffStagedMainUseCaseToken),
      container.resolve(GetDiffCommitMainUseCaseToken),
      container.resolve(GetBranchesMainUseCaseToken),
      container.resolve(GetFileTreeMainUseCaseToken),
      container.resolve(GetFileContentsMainUseCaseToken),
      container.resolve(GetFileContentsCommitMainUseCaseToken),
    )

    return () => {
      unregisterHandlers()
    }
  },
}
