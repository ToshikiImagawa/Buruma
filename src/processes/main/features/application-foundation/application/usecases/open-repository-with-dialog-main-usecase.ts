import type { RepositoryInfo } from '@domain'
import type { SupplierUseCase } from '@lib/usecase/types'
import type { DialogRepository, GitValidationRepository, StoreRepository } from '../repositories/types'
import { addToRecent } from './recent-repository-helper'

export class OpenRepositoryWithDialogMainUseCase implements SupplierUseCase<Promise<RepositoryInfo | null>> {
  constructor(
    private readonly store: StoreRepository,
    private readonly gitValidator: GitValidationRepository,
    private readonly dialogRepository: DialogRepository,
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
