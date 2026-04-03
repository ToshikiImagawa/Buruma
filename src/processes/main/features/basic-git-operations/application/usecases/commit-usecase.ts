import type { CommitArgs, CommitResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class CommitUseCase implements FunctionUseCase<CommitArgs, Promise<CommitResult>> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: CommitArgs): Promise<CommitResult> {
    return this.repository.commit(input)
  }
}
