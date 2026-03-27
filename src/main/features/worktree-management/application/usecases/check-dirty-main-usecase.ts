import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitService } from '../worktree-interfaces'

export class CheckDirtyMainUseCase implements FunctionUseCase<string, Promise<boolean>> {
  constructor(private readonly gitService: IWorktreeGitService) {}

  async invoke(worktreePath: string): Promise<boolean> {
    return this.gitService.isDirty(worktreePath)
  }
}
