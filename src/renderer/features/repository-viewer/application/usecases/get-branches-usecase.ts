import type { BranchList } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { GitViewerRepository } from '../repositories/git-viewer-repository'

export class GetBranchesUseCase implements FunctionUseCase<string, Promise<BranchList>> {
  constructor(private readonly repository: GitViewerRepository) {}

  async invoke(input: string): Promise<BranchList> {
    return this.repository.getBranches(input)
  }
}
