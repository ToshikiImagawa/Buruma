import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'

export class SuggestPathDefaultUseCase implements FunctionUseCase<
  { repoPath: string; branch: string },
  Promise<string>
> {
  constructor(private readonly repo: WorktreeRepository) {}

  invoke(arg: { repoPath: string; branch: string }): Promise<string> {
    return this.repo.suggestPath(arg.repoPath, arg.branch)
  }
}
