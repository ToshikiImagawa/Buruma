import type { FileDiff, GitDiffQuery } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetDiffMainUseCase implements FunctionUseCase<GitDiffQuery, Promise<FileDiff[]>> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: GitDiffQuery): Promise<FileDiff[]> {
    return this.gitRepository.getDiff(input)
  }
}
