import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IGitRepositoryValidator } from '../repository-interfaces'

export class ValidateRepositoryMainUseCase implements FunctionUseCase<string, Promise<boolean>> {
  constructor(private readonly gitValidator: IGitRepositoryValidator) {}

  async invoke(dirPath: string): Promise<boolean> {
    return this.gitValidator.isGitRepository(dirPath)
  }
}
