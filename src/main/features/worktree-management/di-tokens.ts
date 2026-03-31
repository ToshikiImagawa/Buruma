import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeInfo, WorktreeStatus } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { WorktreeGitRepository } from './application/repositories/worktree-git-repository'
import type { WorktreeWatcher } from './application/repositories/worktree-watcher'
import { createToken } from '@shared/lib/di'

// Infrastructure IF
export const WorktreeGitRepositoryToken = createToken<WorktreeGitRepository>('WorktreeGitRepository')
export const WorktreeWatcherToken = createToken<WorktreeWatcher>('WorktreeWatcher')

// Application UseCase 型
export type ListWorktreesMainUseCase = FunctionUseCase<string, Promise<WorktreeInfo[]>>
export type GetWorktreeStatusMainUseCase = FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
>
export type CreateWorktreeMainUseCase = FunctionUseCase<WorktreeCreateParams, Promise<WorktreeInfo>>
export type DeleteWorktreeMainUseCase = FunctionUseCase<WorktreeDeleteParams, Promise<void>>
export type SuggestPathMainUseCase = FunctionUseCase<{ repoPath: string; branch: string }, Promise<string>>
export type CheckDirtyMainUseCase = FunctionUseCase<string, Promise<boolean>>
export type GetDefaultBranchMainUseCase = FunctionUseCase<string, Promise<string>>

// Application UseCase Tokens
export const ListWorktreesMainUseCaseToken = createToken<ListWorktreesMainUseCase>('ListWorktreesMainUseCase')
export const GetWorktreeStatusMainUseCaseToken =
  createToken<GetWorktreeStatusMainUseCase>('GetWorktreeStatusMainUseCase')
export const CreateWorktreeMainUseCaseToken = createToken<CreateWorktreeMainUseCase>('CreateWorktreeMainUseCase')
export const DeleteWorktreeMainUseCaseToken = createToken<DeleteWorktreeMainUseCase>('DeleteWorktreeMainUseCase')
export const SuggestPathMainUseCaseToken = createToken<SuggestPathMainUseCase>('SuggestPathMainUseCase')
export const CheckDirtyMainUseCaseToken = createToken<CheckDirtyMainUseCase>('CheckDirtyMainUseCase')
export const GetDefaultBranchMainUseCaseToken = createToken<GetDefaultBranchMainUseCase>('GetDefaultBranchMainUseCase')
