import type {
  WorktreeChangeEvent,
  WorktreeCreateParams,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeStatus,
} from '@shared/domain'
import type { WorktreeRepository } from '../../application/repositories/worktree-repository'

export class WorktreeRepositoryImpl implements WorktreeRepository {
  async list(repoPath: string): Promise<WorktreeInfo[]> {
    const result = await window.electronAPI.worktree.list(repoPath)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getStatus(repoPath: string, worktreePath: string): Promise<WorktreeStatus> {
    const result = await window.electronAPI.worktree.status(repoPath, worktreePath)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async create(params: WorktreeCreateParams): Promise<WorktreeInfo> {
    const result = await window.electronAPI.worktree.create(params)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async delete(params: WorktreeDeleteParams): Promise<void> {
    const result = await window.electronAPI.worktree.delete(params)
    if (result.success === false) throw new Error(result.error.message)
  }

  async suggestPath(repoPath: string, branch: string): Promise<string> {
    const result = await window.electronAPI.worktree.suggestPath(repoPath, branch)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async checkDirty(worktreePath: string): Promise<boolean> {
    const result = await window.electronAPI.worktree.checkDirty(worktreePath)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  onChanged(callback: (event: WorktreeChangeEvent) => void): () => void {
    return window.electronAPI.worktree.onChanged(callback)
  }
}
