import type { ConsumerUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class CherryPickAbortUseCase implements ConsumerUseCase<string> {
  constructor(private readonly repository: GitAdvancedRepository) {}

  invoke(worktreePath: string): void {
    this.repository.cherryPickAbort(worktreePath)
  }
}
