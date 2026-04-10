import type {
  CherryPickOptions,
  CherryPickResult,
  ConflictFile,
  ConflictResolveAllOptions,
  ConflictResolveOptions,
  GitOperationCompletedEvent,
  InteractiveRebaseOptions,
  MergeOptions,
  MergeResult,
  MergeStatus,
  OperationProgress,
  RebaseOptions,
  RebaseResult,
  RebaseStep,
  StashEntry,
  StashSaveOptions,
  TagCreateOptions,
  TagInfo,
  ThreeWayContent,
} from '@domain'
import type { IPCError } from '@lib/ipc'
import type { ConsumerUseCase, FunctionUseCase, ObservableStoreUseCase } from '@lib/usecase/types'
import type { AdvancedOperationsRepository } from './application/repositories/advanced-operations-repository'
import type { AdvancedOperationsService } from './application/services/advanced-operations-service-interface'
import type {
  CherryPickViewModel,
  ConflictViewModel,
  MergeViewModel,
  RebaseViewModel,
  StashViewModel,
  TagViewModel,
} from './presentation/viewmodel-interfaces'
import { createToken } from '@lib/di'

// Repository IF
export const AdvancedOperationsRepositoryToken =
  createToken<AdvancedOperationsRepository>('AdvancedOperationsRepository')

// Service Token
export const AdvancedOperationsServiceToken = createToken<AdvancedOperationsService>('AdvancedOperationsService')

// --- UseCase 型エイリアス ---

// マージ
export type MergeRendererUseCase = FunctionUseCase<MergeOptions, Promise<MergeResult>>
export type MergeAbortRendererUseCase = ConsumerUseCase<string>
export type MergeStatusRendererUseCase = FunctionUseCase<string, Promise<MergeStatus>>

// リベース
export type RebaseRendererUseCase = FunctionUseCase<RebaseOptions, Promise<RebaseResult>>
export type RebaseInteractiveRendererUseCase = FunctionUseCase<InteractiveRebaseOptions, Promise<RebaseResult>>
export type RebaseAbortRendererUseCase = ConsumerUseCase<string>
export type RebaseContinueRendererUseCase = FunctionUseCase<string, Promise<RebaseResult>>
export type GetRebaseCommitsRendererUseCase = FunctionUseCase<
  { worktreePath: string; onto: string },
  Promise<RebaseStep[]>
>

// スタッシュ
export type StashSaveRendererUseCase = ConsumerUseCase<StashSaveOptions>
export type StashListRendererUseCase = FunctionUseCase<string, Promise<StashEntry[]>>
export type StashPopRendererUseCase = ConsumerUseCase<{ worktreePath: string; index: number }>
export type StashApplyRendererUseCase = ConsumerUseCase<{ worktreePath: string; index: number }>
export type StashDropRendererUseCase = ConsumerUseCase<{ worktreePath: string; index: number }>
export type StashClearRendererUseCase = ConsumerUseCase<string>

// チェリーピック
export type CherryPickRendererUseCase = FunctionUseCase<CherryPickOptions, Promise<CherryPickResult>>
export type CherryPickAbortRendererUseCase = ConsumerUseCase<string>

// コンフリクト解決
export type ConflictListRendererUseCase = FunctionUseCase<string, Promise<ConflictFile[]>>
export type ConflictFileContentRendererUseCase = FunctionUseCase<
  { worktreePath: string; filePath: string },
  Promise<ThreeWayContent>
>
export type ConflictResolveRendererUseCase = ConsumerUseCase<ConflictResolveOptions>
export type ConflictResolveAllRendererUseCase = ConsumerUseCase<ConflictResolveAllOptions>
export type ConflictMarkResolvedRendererUseCase = ConsumerUseCase<{
  worktreePath: string
  filePath: string
}>

// タグ
export type TagListRendererUseCase = FunctionUseCase<string, Promise<TagInfo[]>>
export type TagCreateRendererUseCase = ConsumerUseCase<TagCreateOptions>
export type TagDeleteRendererUseCase = ConsumerUseCase<{
  worktreePath: string
  tagName: string
}>

// Observable UseCases
export type GetAdvancedOperationLoadingUseCase = ObservableStoreUseCase<boolean>
export type GetAdvancedLastErrorUseCase = ObservableStoreUseCase<IPCError | null>
export type GetAdvancedOperationProgressUseCase = ObservableStoreUseCase<OperationProgress | null>
export type GetAdvancedCurrentOperationUseCase = ObservableStoreUseCase<string | null>
export type ObserveAdvancedOperationCompletedUseCase = ObservableStoreUseCase<GitOperationCompletedEvent>

// --- UseCase Tokens ---

// マージ
export const MergeRendererUseCaseToken = createToken<MergeRendererUseCase>('MergeRendererUseCase')
export const MergeAbortRendererUseCaseToken = createToken<MergeAbortRendererUseCase>('MergeAbortRendererUseCase')
export const MergeStatusRendererUseCaseToken = createToken<MergeStatusRendererUseCase>('MergeStatusRendererUseCase')

// リベース
export const RebaseRendererUseCaseToken = createToken<RebaseRendererUseCase>('RebaseRendererUseCase')
export const RebaseInteractiveRendererUseCaseToken = createToken<RebaseInteractiveRendererUseCase>(
  'RebaseInteractiveRendererUseCase',
)
export const RebaseAbortRendererUseCaseToken = createToken<RebaseAbortRendererUseCase>('RebaseAbortRendererUseCase')
export const RebaseContinueRendererUseCaseToken = createToken<RebaseContinueRendererUseCase>(
  'RebaseContinueRendererUseCase',
)
export const GetRebaseCommitsRendererUseCaseToken = createToken<GetRebaseCommitsRendererUseCase>(
  'GetRebaseCommitsRendererUseCase',
)

// スタッシュ
export const StashSaveRendererUseCaseToken = createToken<StashSaveRendererUseCase>('StashSaveRendererUseCase')
export const StashListRendererUseCaseToken = createToken<StashListRendererUseCase>('StashListRendererUseCase')
export const StashPopRendererUseCaseToken = createToken<StashPopRendererUseCase>('StashPopRendererUseCase')
export const StashApplyRendererUseCaseToken = createToken<StashApplyRendererUseCase>('StashApplyRendererUseCase')
export const StashDropRendererUseCaseToken = createToken<StashDropRendererUseCase>('StashDropRendererUseCase')
export const StashClearRendererUseCaseToken = createToken<StashClearRendererUseCase>('StashClearRendererUseCase')

// チェリーピック
export const CherryPickRendererUseCaseToken = createToken<CherryPickRendererUseCase>('CherryPickRendererUseCase')
export const CherryPickAbortRendererUseCaseToken = createToken<CherryPickAbortRendererUseCase>(
  'CherryPickAbortRendererUseCase',
)

// コンフリクト解決
export const ConflictListRendererUseCaseToken = createToken<ConflictListRendererUseCase>('ConflictListRendererUseCase')
export const ConflictFileContentRendererUseCaseToken = createToken<ConflictFileContentRendererUseCase>(
  'ConflictFileContentRendererUseCase',
)
export const ConflictResolveRendererUseCaseToken = createToken<ConflictResolveRendererUseCase>(
  'ConflictResolveRendererUseCase',
)
export const ConflictResolveAllRendererUseCaseToken = createToken<ConflictResolveAllRendererUseCase>(
  'ConflictResolveAllRendererUseCase',
)
export const ConflictMarkResolvedRendererUseCaseToken = createToken<ConflictMarkResolvedRendererUseCase>(
  'ConflictMarkResolvedRendererUseCase',
)

// タグ
export const TagListRendererUseCaseToken = createToken<TagListRendererUseCase>('TagListRendererUseCase')
export const TagCreateRendererUseCaseToken = createToken<TagCreateRendererUseCase>('TagCreateRendererUseCase')
export const TagDeleteRendererUseCaseToken = createToken<TagDeleteRendererUseCase>('TagDeleteRendererUseCase')

// Observable UseCases
export const GetAdvancedOperationLoadingUseCaseToken = createToken<GetAdvancedOperationLoadingUseCase>(
  'GetAdvancedOperationLoadingUseCase',
)
export const GetAdvancedLastErrorUseCaseToken = createToken<GetAdvancedLastErrorUseCase>('GetAdvancedLastErrorUseCase')
export const GetAdvancedOperationProgressUseCaseToken = createToken<GetAdvancedOperationProgressUseCase>(
  'GetAdvancedOperationProgressUseCase',
)
export const GetAdvancedCurrentOperationUseCaseToken = createToken<GetAdvancedCurrentOperationUseCase>(
  'GetAdvancedCurrentOperationUseCase',
)
export const ObserveAdvancedOperationCompletedUseCaseToken = createToken<ObserveAdvancedOperationCompletedUseCase>(
  'AdvancedGitOperationsObserveOperationCompletedUseCase',
)

// --- ViewModel Tokens ---
export const MergeViewModelToken = createToken<MergeViewModel>('MergeViewModel')
export const RebaseViewModelToken = createToken<RebaseViewModel>('RebaseViewModel')
export const StashViewModelToken = createToken<StashViewModel>('StashViewModel')
export const CherryPickViewModelToken = createToken<CherryPickViewModel>('CherryPickViewModel')
export const ConflictViewModelToken = createToken<ConflictViewModel>('ConflictViewModel')
export const TagViewModelToken = createToken<TagViewModel>('TagViewModel')
