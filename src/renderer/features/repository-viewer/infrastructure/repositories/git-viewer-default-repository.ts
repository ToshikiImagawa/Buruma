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
import type { GitViewerRepository } from '../../application/repositories/git-viewer-repository'

export class GitViewerDefaultRepository implements GitViewerRepository {
  async getStatus(worktreePath: string): Promise<GitStatus> {
    const result = await window.electronAPI.git.status({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getLog(query: GitLogQuery): Promise<GitLogResult> {
    const result = await window.electronAPI.git.log(query)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getCommitDetail(worktreePath: string, hash: string): Promise<CommitDetail> {
    const result = await window.electronAPI.git.commitDetail({ worktreePath, hash })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getDiff(query: GitDiffQuery): Promise<FileDiff[]> {
    const result = await window.electronAPI.git.diff(query)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getDiffStaged(query: GitDiffQuery): Promise<FileDiff[]> {
    const result = await window.electronAPI.git.diffStaged(query)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getDiffCommit(worktreePath: string, hash: string, filePath?: string): Promise<FileDiff[]> {
    const result = await window.electronAPI.git.diffCommit({ worktreePath, hash, filePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getBranches(worktreePath: string): Promise<BranchList> {
    const result = await window.electronAPI.git.branches({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getFileTree(worktreePath: string): Promise<FileTreeNode> {
    const result = await window.electronAPI.git.fileTree({ worktreePath })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }
}
