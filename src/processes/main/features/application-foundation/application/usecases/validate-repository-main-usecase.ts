import type { FunctionUseCase } from '@lib/usecase/types'
import type { GitValidationRepository } from '../repositories/types'

export class ValidateRepositoryMainUseCase implements FunctionUseCase<string, Promise<boolean>> {
  constructor(private readonly gitValidator: GitValidationRepository) {}

  async invoke(dirPath: string): Promise<boolean> {
    return this.gitValidator.isGitRepository(dirPath)
  }
}
