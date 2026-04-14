import type { SymlinkConfig } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { WorktreeRepository } from '../repositories/worktree-repository'

export class GetSymlinkConfigDefaultUseCase implements FunctionUseCase<string, Promise<SymlinkConfig>> {
  constructor(private readonly repo: WorktreeRepository) {}

  invoke(repoPath: string): Promise<SymlinkConfig> {
    return this.repo.getSymlinkConfig(repoPath)
  }
}
