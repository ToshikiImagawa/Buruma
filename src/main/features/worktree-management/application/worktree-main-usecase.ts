import path from 'node:path'
import type { IWorktreeGitService } from './worktree-interfaces'
import type {
  WorktreeInfo,
  WorktreeStatus,
  WorktreeCreateParams,
  WorktreeDeleteParams,
} from '@shared/domain'

export class WorktreeMainUseCase {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async list(repoPath: string): Promise<WorktreeInfo[]> {
    const worktrees = await this.gitService.listWorktrees(repoPath)
    const results = await Promise.all(
      worktrees.map(async (wt) => ({
        ...wt,
        isDirty: await this.gitService.isDirty(wt.path),
      })),
    )
    return results
  }

  async getStatus(_repoPath: string, worktreePath: string): Promise<WorktreeStatus> {
    return this.gitService.getStatus(worktreePath)
  }

  async create(params: WorktreeCreateParams): Promise<WorktreeInfo> {
    return this.gitService.addWorktree(params)
  }

  async delete(params: WorktreeDeleteParams): Promise<void> {
    const isMain = await this.gitService.isMainWorktree(params.worktreePath)
    if (isMain) {
      throw new Error('メインワークツリーは削除できません')
    }
    await this.gitService.removeWorktree(params.worktreePath, params.force)
  }

  async suggestPath(repoPath: string, branch: string): Promise<string> {
    const parentDir = path.dirname(repoPath)
    const repoName = path.basename(repoPath)
    const sanitizedBranch = branch.replace(/[/\\:*?"<>|]/g, '-')
    return path.join(parentDir, `${repoName}+${sanitizedBranch}`)
  }

  async checkDirty(worktreePath: string): Promise<boolean> {
    return this.gitService.isDirty(worktreePath)
  }
}
