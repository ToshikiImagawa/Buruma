import type { WorktreeCreateParams, WorktreeDeleteParams, WorktreeInfo, WorktreeStatus } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService, IWorktreeWatcher } from './application/worktree-interfaces'
import { createToken } from '@shared/lib/di'

// Infrastructure IF
export const WorktreeGitServiceToken = createToken<IWorktreeGitService>('WorktreeGitService')
export const WorktreeWatcherToken = createToken<IWorktreeWatcher>('WorktreeWatcher')

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
