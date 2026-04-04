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
import { RebaseUseCase } from './application/usecases/rebase-usecase'
import { RebaseInteractiveUseCase } from './application/usecases/rebase-interactive-usecase'
import { RebaseAbortUseCase } from './application/usecases/rebase-abort-usecase'
import { RebaseContinueUseCase } from './application/usecases/rebase-continue-usecase'
import { GetRebaseCommitsUseCase } from './application/usecases/get-rebase-commits-usecase'
import { StashSaveUseCase } from './application/usecases/stash-save-usecase'
import { StashListUseCase } from './application/usecases/stash-list-usecase'
import { StashPopUseCase } from './application/usecases/stash-pop-usecase'
import { StashApplyUseCase } from './application/usecases/stash-apply-usecase'
import { StashDropUseCase } from './application/usecases/stash-drop-usecase'
import { StashClearUseCase } from './application/usecases/stash-clear-usecase'
import { CherryPickUseCase } from './application/usecases/cherry-pick-usecase'
import { CherryPickAbortUseCase } from './application/usecases/cherry-pick-abort-usecase'
import { TagListUseCase } from './application/usecases/tag-list-usecase'
import { TagCreateUseCase } from './application/usecases/tag-create-usecase'
import { TagDeleteUseCase } from './application/usecases/tag-delete-usecase'
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
  RebaseMainUseCaseToken,
  RebaseInteractiveMainUseCaseToken,
  RebaseAbortMainUseCaseToken,
  RebaseContinueMainUseCaseToken,
  GetRebaseCommitsMainUseCaseToken,
  StashSaveMainUseCaseToken,
  StashListMainUseCaseToken,
  StashPopMainUseCaseToken,
  StashApplyMainUseCaseToken,
  StashDropMainUseCaseToken,
  StashClearMainUseCaseToken,
  CherryPickMainUseCaseToken,
  CherryPickAbortMainUseCaseToken,
  TagListMainUseCaseToken,
  TagCreateMainUseCaseToken,
  TagDeleteMainUseCaseToken,
} from './di-tokens'
import { GitAdvancedDefaultRepository } from './infrastructure/repositories/git-advanced-default-repository'
import { registerGitAdvancedIPCHandlers } from './presentation/ipc-handlers'

export const advancedGitOperationsMainConfig: VContainerConfig = {
  register(container) {
    // Repository (singleton)
    container.registerSingleton(GitAdvancedRepositoryToken, GitAdvancedDefaultRepository)

    // Application UseCases (singleton, deps で依存関係を宣言)
    container
      // マージ
      .registerSingleton(MergeMainUseCaseToken, MergeUseCase, [GitAdvancedRepositoryToken])
      .registerSingleton(MergeAbortMainUseCaseToken, MergeAbortUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(MergeStatusMainUseCaseToken, MergeStatusUseCase, [
        GitAdvancedRepositoryToken,
      ])
      // コンフリクト解決
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
      // リベース
      .registerSingleton(RebaseMainUseCaseToken, RebaseUseCase, [GitAdvancedRepositoryToken])
      .registerSingleton(RebaseInteractiveMainUseCaseToken, RebaseInteractiveUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(RebaseAbortMainUseCaseToken, RebaseAbortUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(RebaseContinueMainUseCaseToken, RebaseContinueUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(GetRebaseCommitsMainUseCaseToken, GetRebaseCommitsUseCase, [
        GitAdvancedRepositoryToken,
      ])
      // スタッシュ
      .registerSingleton(StashSaveMainUseCaseToken, StashSaveUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(StashListMainUseCaseToken, StashListUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(StashPopMainUseCaseToken, StashPopUseCase, [GitAdvancedRepositoryToken])
      .registerSingleton(StashApplyMainUseCaseToken, StashApplyUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(StashDropMainUseCaseToken, StashDropUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(StashClearMainUseCaseToken, StashClearUseCase, [
        GitAdvancedRepositoryToken,
      ])
      // チェ��ーピック
      .registerSingleton(CherryPickMainUseCaseToken, CherryPickUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(CherryPickAbortMainUseCaseToken, CherryPickAbortUseCase, [
        GitAdvancedRepositoryToken,
      ])
      // タグ
      .registerSingleton(TagListMainUseCaseToken, TagListUseCase, [GitAdvancedRepositoryToken])
      .registerSingleton(TagCreateMainUseCaseToken, TagCreateUseCase, [
        GitAdvancedRepositoryToken,
      ])
      .registerSingleton(TagDeleteMainUseCaseToken, TagDeleteUseCase, [
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
      container.resolve(RebaseMainUseCaseToken),
      container.resolve(RebaseInteractiveMainUseCaseToken),
      container.resolve(RebaseAbortMainUseCaseToken),
      container.resolve(RebaseContinueMainUseCaseToken),
      container.resolve(GetRebaseCommitsMainUseCaseToken),
      container.resolve(StashSaveMainUseCaseToken),
      container.resolve(StashListMainUseCaseToken),
      container.resolve(StashPopMainUseCaseToken),
      container.resolve(StashApplyMainUseCaseToken),
      container.resolve(StashDropMainUseCaseToken),
      container.resolve(StashClearMainUseCaseToken),
      container.resolve(CherryPickMainUseCaseToken),
      container.resolve(CherryPickAbortMainUseCaseToken),
      container.resolve(TagListMainUseCaseToken),
      container.resolve(TagCreateMainUseCaseToken),
      container.resolve(TagDeleteMainUseCaseToken),
    )

    return () => {
      unregisterHandlers()
    }
  },
}
