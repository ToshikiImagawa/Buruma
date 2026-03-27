import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService } from '../worktree-interfaces'
import path from 'node:path'

export class SuggestPathMainUseCase implements FunctionUseCase<{ repoPath: string; branch: string }, Promise<string>> {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async invoke(params: { repoPath: string; branch: string }): Promise<string> {
    const worktrees = await this.gitService.listWorktrees(params.repoPath)
    const mainWorktree = worktrees.find((wt) => wt.isMain)
    const basePath = mainWorktree?.path ?? params.repoPath

    const parentDir = path.dirname(basePath)
    const repoName = path.basename(basePath)
    const sanitizedBranch = params.branch.replace(/[/\\:*?"<>|]/g, '-')
    return path.join(parentDir, `${repoName}+${sanitizedBranch}`)
  }
}
