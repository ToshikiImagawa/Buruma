import type {
  MergeOptions,
  MergeResult,
  MergeStatus,
  ConflictFile,
  ThreeWayContent,
  ConflictResolveOptions,
  ConflictResolveAllOptions,
} from '@domain'
import type { ConsumerUseCase, FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from './application/repositories/git-advanced-repository'
import { createToken } from '@lib/di'

// Infrastructure IF
export const GitAdvancedRepositoryToken =
  createToken<GitAdvancedRepository>('GitAdvancedRepository')

// --- マージ ---
export type MergeMainUseCase = FunctionUseCase<MergeOptions, Promise<MergeResult>>
export const MergeMainUseCaseToken = createToken<MergeMainUseCase>('MergeMainUseCase')

export type MergeAbortMainUseCase = ConsumerUseCase<string>
export const MergeAbortMainUseCaseToken = createToken<MergeAbortMainUseCase>('MergeAbortMainUseCase')

export type MergeStatusMainUseCase = FunctionUseCase<string, Promise<MergeStatus>>
export const MergeStatusMainUseCaseToken =
  createToken<MergeStatusMainUseCase>('MergeStatusMainUseCase')

// --- コンフリクト解決 ---
export type ConflictListMainUseCase = FunctionUseCase<string, Promise<ConflictFile[]>>
export const ConflictListMainUseCaseToken =
  createToken<ConflictListMainUseCase>('ConflictListMainUseCase')

export type ConflictFileContentMainUseCase = FunctionUseCase<
  { worktreePath: string; filePath: string },
  Promise<ThreeWayContent>
>
export const ConflictFileContentMainUseCaseToken =
  createToken<ConflictFileContentMainUseCase>('ConflictFileContentMainUseCase')

export type ConflictResolveMainUseCase = ConsumerUseCase<ConflictResolveOptions>
export const ConflictResolveMainUseCaseToken =
  createToken<ConflictResolveMainUseCase>('ConflictResolveMainUseCase')

export type ConflictResolveAllMainUseCase = ConsumerUseCase<ConflictResolveAllOptions>
export const ConflictResolveAllMainUseCaseToken =
  createToken<ConflictResolveAllMainUseCase>('ConflictResolveAllMainUseCase')

export type ConflictMarkResolvedMainUseCase = ConsumerUseCase<{
  worktreePath: string
  filePath: string
}>
export const ConflictMarkResolvedMainUseCaseToken =
  createToken<ConflictMarkResolvedMainUseCase>('ConflictMarkResolvedMainUseCase')
