import type {
  BranchList,
  CommitDetail,
  FileDiff,
  FileTreeNode,
  GitDiffQuery,
  GitLogQuery,
  GitLogResult,
  GitStatus,
} from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { RepositoryViewerService } from './application/services/repository-viewer-service-interface'
import type {
  BranchListViewModel,
  CommitLogViewModel,
  DiffViewViewModel,
  FileTreeViewModel,
  StatusViewModel,
} from './presentation/viewmodel-interfaces'
import { createToken } from '@shared/lib/di'

// Repository IF
export const GitViewerRepositoryToken =
  createToken<import('./application/repositories/git-viewer-repository').GitViewerRepository>('GitViewerRepository')

// UseCase 型
export type GetStatusUseCase = FunctionUseCase<string, Promise<GitStatus>>
export type GetLogUseCase = FunctionUseCase<GitLogQuery, Promise<GitLogResult>>
export type GetCommitDetailUseCase = FunctionUseCase<{ worktreePath: string; hash: string }, Promise<CommitDetail>>
export type GetDiffUseCase = FunctionUseCase<GitDiffQuery, Promise<FileDiff[]>>
export type GetDiffStagedUseCase = FunctionUseCase<GitDiffQuery, Promise<FileDiff[]>>
export type GetDiffCommitUseCase = FunctionUseCase<
  { worktreePath: string; hash: string; filePath?: string },
  Promise<FileDiff[]>
>
export type GetBranchesUseCase = FunctionUseCase<string, Promise<BranchList>>
export type GetFileTreeUseCase = FunctionUseCase<string, Promise<FileTreeNode>>

// UseCase Tokens
export const GetStatusUseCaseToken = createToken<GetStatusUseCase>('GetStatusUseCase')
export const GetLogUseCaseToken = createToken<GetLogUseCase>('GetLogUseCase')
export const GetCommitDetailUseCaseToken = createToken<GetCommitDetailUseCase>('GetCommitDetailUseCase')
export const GetDiffUseCaseToken = createToken<GetDiffUseCase>('GetDiffUseCase')
export const GetDiffStagedUseCaseToken = createToken<GetDiffStagedUseCase>('GetDiffStagedUseCase')
export const GetDiffCommitUseCaseToken = createToken<GetDiffCommitUseCase>('GetDiffCommitUseCase')
export const GetBranchesUseCaseToken = createToken<GetBranchesUseCase>('GetBranchesUseCase')
export const GetFileTreeUseCaseToken = createToken<GetFileTreeUseCase>('GetFileTreeUseCase')

// Service Token
export const RepositoryViewerServiceToken = createToken<RepositoryViewerService>('RepositoryViewerService')

// ViewModel Tokens
export const StatusViewModelToken = createToken<StatusViewModel>('StatusViewModel')
export const CommitLogViewModelToken = createToken<CommitLogViewModel>('CommitLogViewModel')
export const DiffViewViewModelToken = createToken<DiffViewViewModel>('DiffViewViewModel')
export const BranchListViewModelToken = createToken<BranchListViewModel>('BranchListViewModel')
export const FileTreeViewModelToken = createToken<FileTreeViewModel>('FileTreeViewModel')
