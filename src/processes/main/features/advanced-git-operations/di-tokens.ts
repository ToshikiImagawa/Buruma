import type {
  CherryPickOptions,
  CherryPickResult,
  ConflictFile,
  ConflictResolveAllOptions,
  ConflictResolveOptions,
  InteractiveRebaseOptions,
  MergeOptions,
  MergeResult,
  MergeStatus,
  RebaseOptions,
  RebaseResult,
  RebaseStep,
  StashEntry,
  StashSaveOptions,
  TagCreateOptions,
  TagInfo,
  ThreeWayContent,
} from '@domain'
import type { ConsumerUseCase, FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from './application/repositories/git-advanced-repository'
import { createToken } from '@lib/di'

// Infrastructure IF
export const GitAdvancedRepositoryToken = createToken<GitAdvancedRepository>('GitAdvancedRepository')

// --- マージ ---
export type MergeMainUseCase = FunctionUseCase<MergeOptions, Promise<MergeResult>>
export const MergeMainUseCaseToken = createToken<MergeMainUseCase>('MergeMainUseCase')

export type MergeAbortMainUseCase = ConsumerUseCase<string>
export const MergeAbortMainUseCaseToken = createToken<MergeAbortMainUseCase>('MergeAbortMainUseCase')

export type MergeStatusMainUseCase = FunctionUseCase<string, Promise<MergeStatus>>
export const MergeStatusMainUseCaseToken = createToken<MergeStatusMainUseCase>('MergeStatusMainUseCase')

// --- コンフリクト解決 ---
export type ConflictListMainUseCase = FunctionUseCase<string, Promise<ConflictFile[]>>
export const ConflictListMainUseCaseToken = createToken<ConflictListMainUseCase>('ConflictListMainUseCase')

export type ConflictFileContentMainUseCase = FunctionUseCase<
  { worktreePath: string; filePath: string },
  Promise<ThreeWayContent>
>
export const ConflictFileContentMainUseCaseToken = createToken<ConflictFileContentMainUseCase>(
  'ConflictFileContentMainUseCase',
)

export type ConflictResolveMainUseCase = ConsumerUseCase<ConflictResolveOptions>
export const ConflictResolveMainUseCaseToken = createToken<ConflictResolveMainUseCase>('ConflictResolveMainUseCase')

export type ConflictResolveAllMainUseCase = ConsumerUseCase<ConflictResolveAllOptions>
export const ConflictResolveAllMainUseCaseToken = createToken<ConflictResolveAllMainUseCase>(
  'ConflictResolveAllMainUseCase',
)

export type ConflictMarkResolvedMainUseCase = ConsumerUseCase<{
  worktreePath: string
  filePath: string
}>
export const ConflictMarkResolvedMainUseCaseToken = createToken<ConflictMarkResolvedMainUseCase>(
  'ConflictMarkResolvedMainUseCase',
)

// --- リベース ---
export type RebaseMainUseCase = FunctionUseCase<RebaseOptions, Promise<RebaseResult>>
export const RebaseMainUseCaseToken = createToken<RebaseMainUseCase>('RebaseMainUseCase')

export type RebaseInteractiveMainUseCase = FunctionUseCase<InteractiveRebaseOptions, Promise<RebaseResult>>
export const RebaseInteractiveMainUseCaseToken =
  createToken<RebaseInteractiveMainUseCase>('RebaseInteractiveMainUseCase')

export type RebaseAbortMainUseCase = ConsumerUseCase<string>
export const RebaseAbortMainUseCaseToken = createToken<RebaseAbortMainUseCase>('RebaseAbortMainUseCase')

export type RebaseContinueMainUseCase = FunctionUseCase<string, Promise<RebaseResult>>
export const RebaseContinueMainUseCaseToken = createToken<RebaseContinueMainUseCase>('RebaseContinueMainUseCase')

export type GetRebaseCommitsMainUseCase = FunctionUseCase<{ worktreePath: string; onto: string }, Promise<RebaseStep[]>>
export const GetRebaseCommitsMainUseCaseToken = createToken<GetRebaseCommitsMainUseCase>('GetRebaseCommitsMainUseCase')

// --- スタッシュ ---
export type StashSaveMainUseCase = ConsumerUseCase<StashSaveOptions>
export const StashSaveMainUseCaseToken = createToken<StashSaveMainUseCase>('StashSaveMainUseCase')

export type StashListMainUseCase = FunctionUseCase<string, Promise<StashEntry[]>>
export const StashListMainUseCaseToken = createToken<StashListMainUseCase>('StashListMainUseCase')

export type StashPopMainUseCase = ConsumerUseCase<{ worktreePath: string; index: number }>
export const StashPopMainUseCaseToken = createToken<StashPopMainUseCase>('StashPopMainUseCase')

export type StashApplyMainUseCase = ConsumerUseCase<{ worktreePath: string; index: number }>
export const StashApplyMainUseCaseToken = createToken<StashApplyMainUseCase>('StashApplyMainUseCase')

export type StashDropMainUseCase = ConsumerUseCase<{ worktreePath: string; index: number }>
export const StashDropMainUseCaseToken = createToken<StashDropMainUseCase>('StashDropMainUseCase')

export type StashClearMainUseCase = ConsumerUseCase<string>
export const StashClearMainUseCaseToken = createToken<StashClearMainUseCase>('StashClearMainUseCase')

// --- チェリーピック ---
export type CherryPickMainUseCase = FunctionUseCase<CherryPickOptions, Promise<CherryPickResult>>
export const CherryPickMainUseCaseToken = createToken<CherryPickMainUseCase>('CherryPickMainUseCase')

export type CherryPickAbortMainUseCase = ConsumerUseCase<string>
export const CherryPickAbortMainUseCaseToken = createToken<CherryPickAbortMainUseCase>('CherryPickAbortMainUseCase')

// --- タグ ---
export type TagListMainUseCase = FunctionUseCase<string, Promise<TagInfo[]>>
export const TagListMainUseCaseToken = createToken<TagListMainUseCase>('TagListMainUseCase')

export type TagCreateMainUseCase = ConsumerUseCase<TagCreateOptions>
export const TagCreateMainUseCaseToken = createToken<TagCreateMainUseCase>('TagCreateMainUseCase')

export type TagDeleteMainUseCase = ConsumerUseCase<{ worktreePath: string; tagName: string }>
export const TagDeleteMainUseCaseToken = createToken<TagDeleteMainUseCase>('TagDeleteMainUseCase')
