import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IWorktreeGitRepository } from '../repositories/worktree-git-repository'

export class CheckDirtyMainUseCase implements FunctionUseCase<string, Promise<boolean>> {
  constructor(private readonly gitRepository: IWorktreeGitRepository) {}

  async invoke(worktreePath: string): Promise<boolean> {
    return this.gitRepository.isDirty(worktreePath)
  }
}
