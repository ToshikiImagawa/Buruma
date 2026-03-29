import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IGitValidationRepository } from '../repositories/types'

export class ValidateRepositoryMainUseCase implements FunctionUseCase<string, Promise<boolean>> {
  constructor(private readonly gitValidator: IGitValidationRepository) {}

  async invoke(dirPath: string): Promise<boolean> {
    return this.gitValidator.isGitRepository(dirPath)
  }
}
