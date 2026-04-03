import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class UnstageFilesUseCase implements ConsumerUseCase<{ worktreePath: string; files: string[] }> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: { worktreePath: string; files: string[] }): Promise<void> {
    await this.repository.unstage(input.worktreePath, input.files)
  }
}
