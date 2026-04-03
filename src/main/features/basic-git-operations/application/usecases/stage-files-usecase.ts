import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { GitWriteRepository } from '../repositories/git-write-repository'

export class StageFilesUseCase implements ConsumerUseCase<{ worktreePath: string; files: string[] }> {
  constructor(private readonly repository: GitWriteRepository) {}

  async invoke(input: { worktreePath: string; files: string[] }): Promise<void> {
    await this.repository.stage(input.worktreePath, input.files)
  }
}
