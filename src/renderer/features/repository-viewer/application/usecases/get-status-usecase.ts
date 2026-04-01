import type { GitStatus } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetStatusUseCase implements FunctionUseCase<string, Promise<GitStatus>> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: string): Promise<GitStatus> {
    return this.repository.getStatus(input)
  }
}
