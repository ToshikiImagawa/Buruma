import type { TagInfo } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class TagListUseCase implements FunctionUseCase<string, Promise<TagInfo[]>> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(worktreePath: string): Promise<TagInfo[]> {
    return this.repository.tagList(worktreePath)
  }
}
