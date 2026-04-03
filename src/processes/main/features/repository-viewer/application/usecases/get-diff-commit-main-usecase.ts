import type { FileDiff } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetDiffCommitMainUseCase implements FunctionUseCase<
  { worktreePath: string; hash: string; filePath?: string },
  Promise<FileDiff[]>
> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: { worktreePath: string; hash: string; filePath?: string }): Promise<FileDiff[]> {
    return this.gitRepository.getDiffCommit(input.worktreePath, input.hash, input.filePath)
  }
}
