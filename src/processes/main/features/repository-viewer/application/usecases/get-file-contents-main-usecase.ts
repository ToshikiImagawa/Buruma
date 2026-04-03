import type { FileContents } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetFileContentsMainUseCase implements FunctionUseCase<
  { worktreePath: string; filePath: string; staged?: boolean },
  Promise<FileContents>
> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: { worktreePath: string; filePath: string; staged?: boolean }): Promise<FileContents> {
    return this.gitRepository.getFileContents(input.worktreePath, input.filePath, input.staged)
  }
}
