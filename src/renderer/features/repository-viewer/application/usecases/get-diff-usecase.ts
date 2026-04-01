import type { FileDiff, GitDiffQuery } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetDiffUseCase implements FunctionUseCase<GitDiffQuery, Promise<FileDiff[]>> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: GitDiffQuery): Promise<FileDiff[]> {
    return this.repository.getDiff(input)
  }
}
