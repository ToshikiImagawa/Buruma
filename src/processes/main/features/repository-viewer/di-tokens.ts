import type {
  BranchList,
  CommitDetail,
  FileContents,
  FileDiff,
  FileTreeNode,
  GitDiffQuery,
  GitLogQuery,
  GitLogResult,
  GitStatus,
} from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitReadRepository } from './application/repositories/git-read-repository'
import { createToken } from '@lib/di'

// Infrastructure IF
export const GitReadRepositoryToken = createToken<GitReadRepository>('GitReadRepository')

// Application UseCase 型
export type GetStatusMainUseCase = FunctionUseCase<{ worktreePath: string }, Promise<GitStatus>>
export type GetLogMainUseCase = FunctionUseCase<GitLogQuery, Promise<GitLogResult>>
export type GetCommitDetailMainUseCase = FunctionUseCase<{ worktreePath: string; hash: string }, Promise<CommitDetail>>
export type GetDiffMainUseCase = FunctionUseCase<GitDiffQuery, Promise<FileDiff[]>>
export type GetDiffStagedMainUseCase = FunctionUseCase<GitDiffQuery, Promise<FileDiff[]>>
export type GetDiffCommitMainUseCase = FunctionUseCase<
  { worktreePath: string; hash: string; filePath?: string },
  Promise<FileDiff[]>
>
export type GetBranchesMainUseCase = FunctionUseCase<{ worktreePath: string }, Promise<BranchList>>
export type GetFileTreeMainUseCase = FunctionUseCase<{ worktreePath: string }, Promise<FileTreeNode>>
export type GetFileContentsMainUseCase = FunctionUseCase<
  { worktreePath: string; filePath: string; staged?: boolean },
  Promise<FileContents>
>
export type GetFileContentsCommitMainUseCase = FunctionUseCase<
  { worktreePath: string; hash: string; filePath: string },
  Promise<FileContents>
>

// Application UseCase Tokens
export const GetStatusMainUseCaseToken = createToken<GetStatusMainUseCase>('GetStatusMainUseCase')
export const GetLogMainUseCaseToken = createToken<GetLogMainUseCase>('GetLogMainUseCase')
export const GetCommitDetailMainUseCaseToken = createToken<GetCommitDetailMainUseCase>('GetCommitDetailMainUseCase')
export const GetDiffMainUseCaseToken = createToken<GetDiffMainUseCase>('GetDiffMainUseCase')
export const GetDiffStagedMainUseCaseToken = createToken<GetDiffStagedMainUseCase>('GetDiffStagedMainUseCase')
export const GetDiffCommitMainUseCaseToken = createToken<GetDiffCommitMainUseCase>('GetDiffCommitMainUseCase')
export const GetBranchesMainUseCaseToken = createToken<GetBranchesMainUseCase>('GetBranchesMainUseCase')
export const GetFileTreeMainUseCaseToken = createToken<GetFileTreeMainUseCase>('GetFileTreeMainUseCase')
export const GetFileContentsMainUseCaseToken = createToken<GetFileContentsMainUseCase>('GetFileContentsMainUseCase')
export const GetFileContentsCommitMainUseCaseToken = createToken<GetFileContentsCommitMainUseCase>(
  'GetFileContentsCommitMainUseCase',
)
