import type { RepositoryInfo } from '@shared/domain'
import type { SupplierUseCase } from '@shared/lib/usecase/types'
import type { IDialogRepository, IGitValidationRepository, IStoreRepository } from '../repository-interfaces'
import { addToRecent } from './recent-repository-helper'

export class OpenRepositoryWithDialogMainUseCase implements SupplierUseCase<Promise<RepositoryInfo | null>> {
  constructor(
    private readonly store: IStoreRepository,
    private readonly gitValidator: IGitValidationRepository,
    private readonly dialogRepository: IDialogRepository,
  ) {}

  async invoke(): Promise<RepositoryInfo | null> {
    const dirPath = await this.dialogRepository.showOpenDirectoryDialog()
    if (!dirPath) return null

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
