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
import type { ConsumerUseCase, FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitWriteRepository } from './application/repositories/git-write-repository'
import { createToken } from '@shared/lib/di'

// Infrastructure IF
export const GitWriteRepositoryToken = createToken<GitWriteRepository>('GitWriteRepository')

// Application UseCase 型エイリアス
export type StageFilesMainUseCase = ConsumerUseCase<{ worktreePath: string; files: string[] }>
export type UnstageFilesMainUseCase = ConsumerUseCase<{ worktreePath: string; files: string[] }>
export type StageAllMainUseCase = ConsumerUseCase<{ worktreePath: string }>
export type UnstageAllMainUseCase = ConsumerUseCase<{ worktreePath: string }>
export type CommitMainUseCase = FunctionUseCase<CommitArgs, Promise<CommitResult>>
export type PushMainUseCase = FunctionUseCase<PushArgs, Promise<PushResult>>
export type PullMainUseCase = FunctionUseCase<PullArgs, Promise<PullResult>>
export type FetchMainUseCase = FunctionUseCase<FetchArgs, Promise<FetchResult>>
export type CreateBranchMainUseCase = ConsumerUseCase<BranchCreateArgs>
export type CheckoutBranchMainUseCase = ConsumerUseCase<BranchCheckoutArgs>
export type DeleteBranchMainUseCase = ConsumerUseCase<BranchDeleteArgs>

// Application UseCase Tokens
export const StageFilesMainUseCaseToken = createToken<StageFilesMainUseCase>('StageFilesMainUseCase')
export const UnstageFilesMainUseCaseToken = createToken<UnstageFilesMainUseCase>('UnstageFilesMainUseCase')
export const StageAllMainUseCaseToken = createToken<StageAllMainUseCase>('StageAllMainUseCase')
export const UnstageAllMainUseCaseToken = createToken<UnstageAllMainUseCase>('UnstageAllMainUseCase')
export const CommitMainUseCaseToken = createToken<CommitMainUseCase>('CommitMainUseCase')
export const PushMainUseCaseToken = createToken<PushMainUseCase>('PushMainUseCase')
export const PullMainUseCaseToken = createToken<PullMainUseCase>('PullMainUseCase')
export const FetchMainUseCaseToken = createToken<FetchMainUseCase>('FetchMainUseCase')
export const CreateBranchMainUseCaseToken = createToken<CreateBranchMainUseCase>('CreateBranchMainUseCase')
export const CheckoutBranchMainUseCaseToken = createToken<CheckoutBranchMainUseCase>('CheckoutBranchMainUseCase')
export const DeleteBranchMainUseCaseToken = createToken<DeleteBranchMainUseCase>('DeleteBranchMainUseCase')
