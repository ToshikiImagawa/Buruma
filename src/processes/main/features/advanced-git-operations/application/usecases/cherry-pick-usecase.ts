import type { CherryPickOptions, CherryPickResult } from '@domain'
import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'

export class CherryPickUseCase
  implements FunctionUseCase<CherryPickOptions, Promise<CherryPickResult>>
{
  constructor(private readonly repository: GitAdvancedRepository) {}

  async invoke(input: CherryPickOptions): Promise<CherryPickResult> {
    return this.repository.cherryPick(input)
  }
}
