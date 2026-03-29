import type {
  WorktreeCreateParams,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeSortOrder,
  WorktreeStatus,
} from '@shared/domain'
import type {
  ConsumerUseCase,
  FunctionUseCase,
  ObservableStoreUseCase,
  RunnableUseCase,
} from '@shared/lib/usecase/types'
import type { WorktreeRepository } from './application/repositories/worktree-repository'
import type { IWorktreeService } from './application/services/worktree-service-interface'
import type { IWorktreeDetailViewModel, IWorktreeListViewModel } from './presentation/viewmodel-interfaces'
import { createToken } from '@shared/lib/di'

// re-export for convenience
export type { WorktreeRepository } from './application/repositories/worktree-repository'
export type { IWorktreeService } from './application/services/worktree-service-interface'
export type { IWorktreeListViewModel, IWorktreeDetailViewModel } from './presentation/viewmodel-interfaces'

// --- UseCase 型 ---
export type ListWorktreesUseCase = ObservableStoreUseCase<WorktreeInfo[]>
export type SelectWorktreeUseCase = ConsumerUseCase<string | null>
export type CreateWorktreeUseCase = ConsumerUseCase<WorktreeCreateParams>
export type DeleteWorktreeUseCase = ConsumerUseCase<WorktreeDeleteParams>
export type RefreshWorktreesUseCase = RunnableUseCase
export type SuggestPathUseCase = FunctionUseCase<{ repoPath: string; branch: string }, Promise<string>>
export type CheckDirtyUseCase = FunctionUseCase<string, Promise<boolean>>
export type GetSelectedWorktreeUseCase = ObservableStoreUseCase<WorktreeInfo | null>
export type GetSelectedPathUseCase = ObservableStoreUseCase<string | null>
export type SetSortOrderUseCase = ConsumerUseCase<WorktreeSortOrder>
export type GetWorktreeStatusUseCase = FunctionUseCase<
  { repoPath: string; worktreePath: string },
  Promise<WorktreeStatus>
>

// --- Token 定義 ---
export const WorktreeRepositoryToken = createToken<WorktreeRepository>('WorktreeRepository')
export const WorktreeServiceToken = createToken<IWorktreeService>('WorktreeService')

export const ListWorktreesUseCaseToken = createToken<ListWorktreesUseCase>('ListWorktreesUseCase')
export const SelectWorktreeUseCaseToken = createToken<SelectWorktreeUseCase>('SelectWorktreeUseCase')
export const CreateWorktreeUseCaseToken = createToken<CreateWorktreeUseCase>('CreateWorktreeUseCase')
export const DeleteWorktreeUseCaseToken = createToken<DeleteWorktreeUseCase>('DeleteWorktreeUseCase')
export const RefreshWorktreesUseCaseToken = createToken<RefreshWorktreesUseCase>('RefreshWorktreesUseCase')
export const SuggestPathUseCaseToken = createToken<SuggestPathUseCase>('SuggestPathUseCase')
export const CheckDirtyUseCaseToken = createToken<CheckDirtyUseCase>('CheckDirtyUseCase')
export const GetSelectedWorktreeUseCaseToken = createToken<GetSelectedWorktreeUseCase>('GetSelectedWorktreeUseCase')
export const GetSelectedPathUseCaseToken = createToken<GetSelectedPathUseCase>('GetSelectedPathUseCase')
export const SetSortOrderUseCaseToken = createToken<SetSortOrderUseCase>('SetSortOrderUseCase')
export const GetWorktreeStatusUseCaseToken = createToken<GetWorktreeStatusUseCase>('GetWorktreeStatusUseCase')

export const WorktreeListViewModelToken = createToken<IWorktreeListViewModel>('WorktreeListViewModel')
export const WorktreeDetailViewModelToken = createToken<IWorktreeDetailViewModel>('WorktreeDetailViewModel')
