import type { PullArgs, PullResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class PullUseCase implements FunctionUseCase<PullArgs, Promise<PullResult>> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: PullArgs): Promise<PullResult> {
    return this.repository.pull(input)
  }
}
