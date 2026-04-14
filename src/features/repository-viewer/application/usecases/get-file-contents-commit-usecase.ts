import type { FileContents } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetFileContentsCommitUseCase implements FunctionUseCase<
  { worktreePath: string; hash: string; filePath: string },
  Promise<FileContents>
> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: { worktreePath: string; hash: string; filePath: string }): Promise<FileContents> {
    return this.repository.getFileContentsCommit(input.worktreePath, input.hash, input.filePath)
  }
}
