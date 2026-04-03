import type { GitLogQuery, GitLogResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitReadRepository } from '../repositories/git-read-repository'

export class GetLogMainUseCase implements FunctionUseCase<GitLogQuery, Promise<GitLogResult>> {
  constructor(private readonly gitRepository: GitReadRepository) {}

  async invoke(input: GitLogQuery): Promise<GitLogResult> {
    return this.gitRepository.getLog(input)
  }
}
