import type { FileDiff } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetDiffCommitUseCase implements FunctionUseCase<
  { worktreePath: string; hash: string; filePath?: string },
  Promise<FileDiff[]>
> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: { worktreePath: string; hash: string; filePath?: string }): Promise<FileDiff[]> {
    return this.repository.getDiffCommit(input.worktreePath, input.hash, input.filePath)
  }
}
