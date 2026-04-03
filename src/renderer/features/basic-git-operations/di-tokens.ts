import type {
  BranchCheckoutArgs,
  BranchCreateArgs,
  BranchDeleteArgs,
  CommitArgs,
  CommitResult,
  FetchArgs,
  FetchResult,
  PullArgs,
  PullResult,
  PushArgs,
  PushResult,
} from '@shared/domain'
import type { ConsumerUseCase, FunctionUseCase, ObservableStoreUseCase } from '@shared/lib/usecase/types'
import type { IPCError } from '@shared/types/ipc'
import type { GitOperationsRepository } from './application/repositories/git-operations-repository'
import type { GitOperationsService } from './application/services/git-operations-service-interface'
import type {
  BranchOpsViewModel,
  CommitViewModel,
  RemoteOpsViewModel,
  StagingViewModel,
} from './presentation/viewmodel-interfaces'
import { createToken } from '@shared/lib/di'

// Repository IF
export const GitOperationsRepositoryToken = createToken<GitOperationsRepository>('GitOperationsRepository')

// Service Token
export const GitOperationsServiceToken = createToken<GitOperationsService>('GitOperationsService')

// UseCase 型エイリアス
export type StageFilesRendererUseCase = ConsumerUseCase<{ worktreePath: string; files: string[] }>
export type UnstageFilesRendererUseCase = ConsumerUseCase<{ worktreePath: string; files: string[] }>
export type StageAllRendererUseCase = ConsumerUseCase<{ worktreePath: string }>
export type UnstageAllRendererUseCase = ConsumerUseCase<{ worktreePath: string }>
export type CommitRendererUseCase = FunctionUseCase<CommitArgs, Promise<CommitResult>>
export type PushRendererUseCase = FunctionUseCase<PushArgs, Promise<PushResult>>
export type PullRendererUseCase = FunctionUseCase<PullArgs, Promise<PullResult>>
export type FetchRendererUseCase = FunctionUseCase<FetchArgs, Promise<FetchResult>>
export type CreateBranchRendererUseCase = ConsumerUseCase<BranchCreateArgs>
export type CheckoutBranchRendererUseCase = ConsumerUseCase<BranchCheckoutArgs>
export type DeleteBranchRendererUseCase = ConsumerUseCase<BranchDeleteArgs>
export type GetOperationLoadingUseCase = ObservableStoreUseCase<boolean>
export type GetLastErrorUseCase = ObservableStoreUseCase<IPCError | null>

// UseCase Tokens
export const StageFilesRendererUseCaseToken = createToken<StageFilesRendererUseCase>('StageFilesRendererUseCase')
export const UnstageFilesRendererUseCaseToken = createToken<UnstageFilesRendererUseCase>('UnstageFilesRendererUseCase')
export const StageAllRendererUseCaseToken = createToken<StageAllRendererUseCase>('StageAllRendererUseCase')
export const UnstageAllRendererUseCaseToken = createToken<UnstageAllRendererUseCase>('UnstageAllRendererUseCase')
export const CommitRendererUseCaseToken = createToken<CommitRendererUseCase>('CommitRendererUseCase')
export const PushRendererUseCaseToken = createToken<PushRendererUseCase>('PushRendererUseCase')
export const PullRendererUseCaseToken = createToken<PullRendererUseCase>('PullRendererUseCase')
export const FetchRendererUseCaseToken = createToken<FetchRendererUseCase>('FetchRendererUseCase')
export const CreateBranchRendererUseCaseToken = createToken<CreateBranchRendererUseCase>('CreateBranchRendererUseCase')
export const CheckoutBranchRendererUseCaseToken = createToken<CheckoutBranchRendererUseCase>(
  'CheckoutBranchRendererUseCase',
)
export const DeleteBranchRendererUseCaseToken = createToken<DeleteBranchRendererUseCase>('DeleteBranchRendererUseCase')
export const GetOperationLoadingUseCaseToken = createToken<GetOperationLoadingUseCase>('GetOperationLoadingUseCase')
export const GetLastErrorUseCaseToken = createToken<GetLastErrorUseCase>('GetLastErrorUseCase')

// ViewModel Tokens
export const StagingViewModelToken = createToken<StagingViewModel>('StagingViewModel')
export const CommitViewModelToken = createToken<CommitViewModel>('CommitViewModel')
export const RemoteOpsViewModelToken = createToken<RemoteOpsViewModel>('RemoteOpsViewModel')
export const BranchOpsViewModelToken = createToken<BranchOpsViewModel>('BranchOpsViewModel')
