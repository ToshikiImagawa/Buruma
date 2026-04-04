import type { ConflictFile } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class ConflictListUseCase implements FunctionUseCase<string, Promise<ConflictFile[]>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(worktreePath: string): Promise<ConflictFile[]> {
    return this.repository.conflictList(worktreePath)
  }
}
