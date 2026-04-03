import type { CommitDetail } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetCommitDetailUseCase implements FunctionUseCase<
  { worktreePath: string; hash: string },
  Promise<CommitDetail>
> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: { worktreePath: string; hash: string }): Promise<CommitDetail> {
    return this.repository.getCommitDetail(input.worktreePath, input.hash)
  }
}
