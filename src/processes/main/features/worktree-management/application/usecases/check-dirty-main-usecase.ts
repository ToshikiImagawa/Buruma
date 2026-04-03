import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeGitRepository } from '../repositories/worktree-git-repository'

export class CheckDirtyMainUseCase implements FunctionUseCase<string, Promise<boolean>> {
  constructor(private readonly gitRepository: WorktreeGitRepository) {}

  async invoke(worktreePath: string): Promise<boolean> {
    return this.gitRepository.isDirty(worktreePath)
  }
}
