import type { CommitDetail } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetCommitDetailMainUseCase implements FunctionUseCase<
  { worktreePath: string; hash: string },
  Promise<CommitDetail>
> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: { worktreePath: string; hash: string }): Promise<CommitDetail> {
    return this.gitRepository.getCommitDetail(input.worktreePath, input.hash)
  }
}
