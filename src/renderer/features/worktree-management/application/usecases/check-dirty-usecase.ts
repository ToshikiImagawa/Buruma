import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { WorktreeRepository } from '../../di-tokens'

export class CheckDirtyUseCaseImpl implements FunctionUseCase<string, Promise<boolean>> {
  constructor(private readonly repo: WorktreeRepository) {}

  invoke(worktreePath: string): Promise<boolean> {
    return this.repo.checkDirty(worktreePath)
  }
}
