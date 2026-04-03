import type { GitStatus } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetStatusMainUseCase implements FunctionUseCase<{ worktreePath: string }, Promise<GitStatus>> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: { worktreePath: string }): Promise<GitStatus> {
    return this.gitRepository.getStatus(input.worktreePath)
  }
}
