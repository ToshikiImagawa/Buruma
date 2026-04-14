import type { FileContents } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetFileContentsUseCase implements FunctionUseCase<
  { worktreePath: string; filePath: string; staged: boolean },
  Promise<FileContents>
> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: { worktreePath: string; filePath: string; staged: boolean }): Promise<FileContents> {
    return this.repository.getFileContents(input.worktreePath, input.filePath, input.staged)
  }
}
