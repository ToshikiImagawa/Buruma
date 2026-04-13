import type {
  BranchList,
  SymlinkConfig,
  WorktreeChangeEvent,
  WorktreeCreateParams,
  WorktreeCreateResult,
  WorktreeDeleteParams,
  WorktreeInfo,
  WorktreeStatus,
} from '@domain'
import type { IPCError } from '@lib/ipc'
import type { WorktreeRepository } from '../../application/repositories/worktree-repository'
import { invokeCommand } from '@lib/invoke/commands'
import { listenEventSync } from '@lib/invoke/events'

export class WorktreeError extends Error {
  readonly code: string
  constructor(error: IPCError) {
    super(error.message)
    this.name = 'WorktreeError'
    this.code = error.code
  }
}

export class WorktreeDefaultRepository implements WorktreeRepository {
  async list(repoPath: string): Promise<WorktreeInfo[]> {
    const result = await invokeCommand<WorktreeInfo[]>('worktree_list', { repoPath })
    if (result.success === false) throw new WorktreeError(result.error)
    return result.data
  }

  async getStatus(repoPath: string, worktreePath: string): Promise<WorktreeStatus> {
    const result = await invokeCommand<WorktreeStatus>('worktree_status', { repoPath, worktreePath })
    if (result.success === false) throw new WorktreeError(result.error)
    return result.data
  }

  async create(params: WorktreeCreateParams): Promise<WorktreeCreateResult> {
    const result = await invokeCommand<WorktreeCreateResult>('worktree_create', { params })
    if (result.success === false) throw new WorktreeError(result.error)
    return result.data
  }

  async delete(params: WorktreeDeleteParams): Promise<void> {
    const result = await invokeCommand<void>('worktree_delete', { params })
    if (result.success === false) throw new WorktreeError(result.error)
  }

  async suggestPath(repoPath: string, branch: string): Promise<string> {
    const result = await invokeCommand<string>('worktree_suggest_path', { repoPath, branch })
    if (result.success === false) throw new WorktreeError(result.error)
    return result.data
  }

  async checkDirty(worktreePath: string): Promise<boolean> {
    const result = await invokeCommand<boolean>('worktree_check_dirty', { worktreePath })
    if (result.success === false) throw new WorktreeError(result.error)
    return result.data
  }

  async getBranches(worktreePath: string): Promise<BranchList> {
    const result = await invokeCommand<BranchList>('git_branches', { args: { worktreePath } })
    if (result.success === false) throw new WorktreeError(result.error)
    return result.data
  }

  async getSymlinkConfig(repoPath: string): Promise<SymlinkConfig> {
    const result = await invokeCommand<SymlinkConfig>('worktree_symlink_config_get', { repoPath })
    if (result.success === false) throw new WorktreeError(result.error)
    return result.data
  }

  async setSymlinkConfig(repoPath: string, config: SymlinkConfig): Promise<void> {
    const result = await invokeCommand<void>('worktree_symlink_config_set', { repoPath, config })
    if (result.success === false) throw new WorktreeError(result.error)
  }

  onChanged(callback: (event: WorktreeChangeEvent) => void): () => void {
    return listenEventSync('worktree-changed', callback)
  }
}
