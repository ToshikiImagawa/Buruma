import type { RepositoryInfo } from '@shared/domain'
import type { FunctionUseCase } from '@shared/lib/usecase/types'
import type { IGitValidationRepository, IStoreRepository } from '../repositories/types'
import { addToRecent } from './recent-repository-helper'

export class OpenRepositoryByPathMainUseCase implements FunctionUseCase<string, Promise<RepositoryInfo | null>> {
  constructor(
    private readonly store: IStoreRepository,
    private readonly gitValidator: IGitValidationRepository,
  ) {}

  async invoke(dirPath: string): Promise<RepositoryInfo | null> {
    const isValid = await this.gitValidator.isGitRepository(dirPath)
    if (!isValid) return null

    const repoInfo: RepositoryInfo = {
      path: dirPath,
      name: dirPath.split(/[/\\]/).filter(Boolean).pop() ?? dirPath,
      isValid: true,
    }

    addToRecent(this.store, repoInfo)
    return repoInfo
  }
}
