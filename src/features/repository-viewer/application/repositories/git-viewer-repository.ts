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

/** レンダラー側 Git 閲覧リポジトリ IF */
export interface GitViewerRepository {
  getStatus(worktreePath: string): Promise<GitStatus>
  getLog(query: GitLogQuery): Promise<GitLogResult>
  getCommitDetail(worktreePath: string, hash: string): Promise<CommitDetail>
  getDiff(query: GitDiffQuery): Promise<FileDiff[]>
  getDiffStaged(query: GitDiffQuery): Promise<FileDiff[]>
  getDiffCommit(worktreePath: string, hash: string, filePath?: string): Promise<FileDiff[]>
  getBranches(worktreePath: string): Promise<BranchList>
  getFileTree(worktreePath: string): Promise<FileTreeNode>
  getFileContents(worktreePath: string, filePath: string, staged: boolean): Promise<FileContents>
  getFileContentsCommit(worktreePath: string, hash: string, filePath: string): Promise<FileContents>
}
