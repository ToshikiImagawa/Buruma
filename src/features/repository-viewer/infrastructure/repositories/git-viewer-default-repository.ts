import type {
  BranchList,
  CommitDetail,
  FileDiff,
  FileTreeNode,
  GitDiffQuery,
  GitLogQuery,
  GitLogResult,
  GitStatus,
} from '@domain'
import { invokeCommand } from '@/shared/lib/invoke/commands'
import type { GitViewerRepository } from '../../application/repositories/git-viewer-repository'

export class GitViewerDefaultRepository implements GitViewerRepository {
  async getStatus(worktreePath: string): Promise<GitStatus> {
    const result = await invokeCommand<GitStatus>('git_status', { args: { worktreePath } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getLog(query: GitLogQuery): Promise<GitLogResult> {
    const result = await invokeCommand<GitLogResult>('git_log', { query })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getCommitDetail(worktreePath: string, hash: string): Promise<CommitDetail> {
    const result = await invokeCommand<CommitDetail>('git_commit_detail', { args: { worktreePath, hash } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getDiff(query: GitDiffQuery): Promise<FileDiff[]> {
    const result = await invokeCommand<FileDiff[]>('git_diff', { query })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getDiffStaged(query: GitDiffQuery): Promise<FileDiff[]> {
    const result = await invokeCommand<FileDiff[]>('git_diff_staged', { query })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getDiffCommit(worktreePath: string, hash: string, filePath?: string): Promise<FileDiff[]> {
    const result = await invokeCommand<FileDiff[]>('git_diff_commit', { args: { worktreePath, hash, filePath } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getBranches(worktreePath: string): Promise<BranchList> {
    const result = await invokeCommand<BranchList>('git_branches', { args: { worktreePath } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getFileTree(worktreePath: string): Promise<FileTreeNode> {
    const result = await invokeCommand<FileTreeNode>('git_file_tree', { args: { worktreePath } })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }
}
