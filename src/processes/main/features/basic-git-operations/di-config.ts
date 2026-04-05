import type { VContainerConfig } from '@lib/di'
import { BrowserWindow } from 'electron'
import { CheckoutBranchUseCase } from './application/usecases/checkout-branch-usecase'
import { CommitUseCase } from './application/usecases/commit-usecase'
import { CreateBranchUseCase } from './application/usecases/create-branch-usecase'
import { DeleteBranchUseCase } from './application/usecases/delete-branch-usecase'
import { FetchUseCase } from './application/usecases/fetch-usecase'
import { PullUseCase } from './application/usecases/pull-usecase'
import { PushUseCase } from './application/usecases/push-usecase'
import { ResetUseCase } from './application/usecases/reset-usecase'
import { StageAllUseCase } from './application/usecases/stage-all-usecase'
import { StageFilesUseCase } from './application/usecases/stage-files-usecase'
import { UnstageAllUseCase } from './application/usecases/unstage-all-usecase'
import { UnstageFilesUseCase } from './application/usecases/unstage-files-usecase'
import {
  CheckoutBranchMainUseCaseToken,
  CommitMainUseCaseToken,
  CreateBranchMainUseCaseToken,
  DeleteBranchMainUseCaseToken,
  FetchMainUseCaseToken,
  GitWriteRepositoryToken,
  PullMainUseCaseToken,
  PushMainUseCaseToken,
  ResetMainUseCaseToken,
  StageAllMainUseCaseToken,
  StageFilesMainUseCaseToken,
  UnstageAllMainUseCaseToken,
  UnstageFilesMainUseCaseToken,
} from './di-tokens'
import { GitWriteDefaultRepository } from './infrastructure/repositories/git-write-default-repository'
import { registerGitWriteIPCHandlers } from './presentation/ipc-handlers'

export const basicGitOperationsMainConfig: VContainerConfig = {
  register(container) {
    // Repository (singleton)
    container.registerSingleton(GitWriteRepositoryToken, GitWriteDefaultRepository)

    // Application UseCases (singleton, deps で依存関係を宣言)
    container
      .registerSingleton(StageFilesMainUseCaseToken, StageFilesUseCase, [GitWriteRepositoryToken])
      .registerSingleton(UnstageFilesMainUseCaseToken, UnstageFilesUseCase, [GitWriteRepositoryToken])
      .registerSingleton(StageAllMainUseCaseToken, StageAllUseCase, [GitWriteRepositoryToken])
      .registerSingleton(UnstageAllMainUseCaseToken, UnstageAllUseCase, [GitWriteRepositoryToken])
      .registerSingleton(CommitMainUseCaseToken, CommitUseCase, [GitWriteRepositoryToken])
      .registerSingleton(PushMainUseCaseToken, PushUseCase, [GitWriteRepositoryToken])
      .registerSingleton(PullMainUseCaseToken, PullUseCase, [GitWriteRepositoryToken])
      .registerSingleton(FetchMainUseCaseToken, FetchUseCase, [GitWriteRepositoryToken])
      .registerSingleton(CreateBranchMainUseCaseToken, CreateBranchUseCase, [GitWriteRepositoryToken])
      .registerSingleton(CheckoutBranchMainUseCaseToken, CheckoutBranchUseCase, [GitWriteRepositoryToken])
      .registerSingleton(DeleteBranchMainUseCaseToken, DeleteBranchUseCase, [GitWriteRepositoryToken])
      .registerSingleton(ResetMainUseCaseToken, ResetUseCase, [GitWriteRepositoryToken])
  },

  setUp: async (container) => {
    // 進捗フィードバック: GitWriteDefaultRepository に BrowserWindow 経由の通知を注入
    const repo = container.resolve(GitWriteRepositoryToken) as GitWriteDefaultRepository
    repo.setProgressCallback((event) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send('git:progress', event)
      }
    })

    const unregisterHandlers = registerGitWriteIPCHandlers(
      container.resolve(StageFilesMainUseCaseToken),
      container.resolve(UnstageFilesMainUseCaseToken),
      container.resolve(StageAllMainUseCaseToken),
      container.resolve(UnstageAllMainUseCaseToken),
      container.resolve(CommitMainUseCaseToken),
      container.resolve(PushMainUseCaseToken),
      container.resolve(PullMainUseCaseToken),
      container.resolve(FetchMainUseCaseToken),
      container.resolve(CreateBranchMainUseCaseToken),
      container.resolve(CheckoutBranchMainUseCaseToken),
      container.resolve(DeleteBranchMainUseCaseToken),
      container.resolve(ResetMainUseCaseToken),
    )

    return () => {
      unregisterHandlers()
    }
  },
}
