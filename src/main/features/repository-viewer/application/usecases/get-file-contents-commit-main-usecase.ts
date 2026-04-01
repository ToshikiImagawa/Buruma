import type { FileContents } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetFileContentsCommitMainUseCase implements FunctionUseCase<
  { worktreePath: string; hash: string; filePath: string },
  Promise<FileContents>
> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: { worktreePath: string; hash: string; filePath: string }): Promise<FileContents> {
    return this.gitRepository.getFileContentsCommit(input.worktreePath, input.hash, input.filePath)
  }
}
