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
import type { RepositoryViewerService } from './application/services/repository-viewer-service-interface'
import type {
  BranchListViewModel,
  CommitLogViewModel,
  DiffViewViewModel,
  FileTreeViewModel,
  GitRefreshCoordinatorViewModel,
  StatusViewModel,
} from './presentation/viewmodel-interfaces'
import { createToken } from '@lib/di'

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
export type GetFileContentsUseCase = FunctionUseCase<
  { worktreePath: string; filePath: string; staged: boolean },
  Promise<FileContents>
>
export type GetFileContentsCommitUseCase = FunctionUseCase<
  { worktreePath: string; hash: string; filePath: string },
  Promise<FileContents>
>

// UseCase Tokens
export const GetStatusUseCaseToken = createToken<GetStatusUseCase>('GetStatusUseCase')
export const GetLogUseCaseToken = createToken<GetLogUseCase>('GetLogUseCase')
export const GetCommitDetailUseCaseToken = createToken<GetCommitDetailUseCase>('GetCommitDetailUseCase')
export const GetDiffUseCaseToken = createToken<GetDiffUseCase>('GetDiffUseCase')
export const GetDiffStagedUseCaseToken = createToken<GetDiffStagedUseCase>('GetDiffStagedUseCase')
export const GetDiffCommitUseCaseToken = createToken<GetDiffCommitUseCase>('GetDiffCommitUseCase')
export const GetBranchesUseCaseToken = createToken<GetBranchesUseCase>('GetBranchesUseCase')
export const GetFileTreeUseCaseToken = createToken<GetFileTreeUseCase>('GetFileTreeUseCase')
export const GetFileContentsUseCaseToken = createToken<GetFileContentsUseCase>('GetFileContentsUseCase')
export const GetFileContentsCommitUseCaseToken =
  createToken<GetFileContentsCommitUseCase>('GetFileContentsCommitUseCase')

// Service Token
export const RepositoryViewerServiceToken = createToken<RepositoryViewerService>('RepositoryViewerService')

// ViewModel Tokens
export const StatusViewModelToken = createToken<StatusViewModel>('StatusViewModel')
export const CommitLogViewModelToken = createToken<CommitLogViewModel>('CommitLogViewModel')
export const DiffViewViewModelToken = createToken<DiffViewViewModel>('DiffViewViewModel')
export const BranchListViewModelToken = createToken<BranchListViewModel>('BranchListViewModel')
export const FileTreeViewModelToken = createToken<FileTreeViewModel>('FileTreeViewModel')
export const GitRefreshCoordinatorViewModelToken = createToken<GitRefreshCoordinatorViewModel>(
  'GitRefreshCoordinatorViewModel',
)
