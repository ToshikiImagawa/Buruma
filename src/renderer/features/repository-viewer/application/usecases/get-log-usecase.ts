import type { GitLogQuery, GitLogResult } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetLogUseCase implements FunctionUseCase<GitLogQuery, Promise<GitLogResult>> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: GitLogQuery): Promise<GitLogResult> {
    return this.repository.getLog(input)
  }
}
