import type { ThreeWayContent } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class ConflictFileContentUseCase implements FunctionUseCase<
  { worktreePath: string; filePath: string },
  Promise<ThreeWayContent>
> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: { worktreePath: string; filePath: string }): Promise<ThreeWayContent> {
    return this.repository.conflictFileContent(input.worktreePath, input.filePath)
  }
}
