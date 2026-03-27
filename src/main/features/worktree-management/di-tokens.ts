import type { CheckDirtyMainUseCase } from './application/usecases/check-dirty-main-usecase'
import type { CreateWorktreeMainUseCase } from './application/usecases/create-worktree-main-usecase'
import type { DeleteWorktreeMainUseCase } from './application/usecases/delete-worktree-main-usecase'
import type { GetDefaultBranchMainUseCase } from './application/usecases/get-default-branch-main-usecase'
import type { GetWorktreeStatusMainUseCase } from './application/usecases/get-worktree-status-main-usecase'
import type { ListWorktreesMainUseCase } from './application/usecases/list-worktrees-main-usecase'
import type { SuggestPathMainUseCase } from './application/usecases/suggest-path-main-usecase'
import type { IWorktreeGitService, IWorktreeWatcher } from './application/worktree-interfaces'
import { createToken } from '@shared/lib/di'

// Infrastructure IF
export const WorktreeGitServiceToken = createToken<IWorktreeGitService>('WorktreeGitService')
export const WorktreeWatcherToken = createToken<IWorktreeWatcher>('WorktreeWatcher')

// Application UseCases
export const ListWorktreesMainUseCaseToken = createToken<ListWorktreesMainUseCase>('ListWorktreesMainUseCase')
export const GetWorktreeStatusMainUseCaseToken =
  createToken<GetWorktreeStatusMainUseCase>('GetWorktreeStatusMainUseCase')
export const CreateWorktreeMainUseCaseToken = createToken<CreateWorktreeMainUseCase>('CreateWorktreeMainUseCase')
export const DeleteWorktreeMainUseCaseToken = createToken<DeleteWorktreeMainUseCase>('DeleteWorktreeMainUseCase')
export const SuggestPathMainUseCaseToken = createToken<SuggestPathMainUseCase>('SuggestPathMainUseCase')
export const CheckDirtyMainUseCaseToken = createToken<CheckDirtyMainUseCase>('CheckDirtyMainUseCase')
export const GetDefaultBranchMainUseCaseToken = createToken<GetDefaultBranchMainUseCase>('GetDefaultBranchMainUseCase')
