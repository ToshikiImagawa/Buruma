import type { RepositoryInfo } from '@shared/domain'
import type { SupplierUseCase } from '@shared/lib/usecase/types'
import type { IDialogService, IGitRepositoryValidator, IStoreRepository } from '../repository-interfaces'
import { addToRecent } from './recent-repository-helper'

export class OpenRepositoryWithDialogMainUseCase implements SupplierUseCase<Promise<RepositoryInfo | null>> {
  constructor(
    private readonly store: IStoreRepository,
    private readonly gitValidator: IGitRepositoryValidator,
    private readonly dialogService: IDialogService,
  ) {}

  async invoke(): Promise<RepositoryInfo | null> {
    const dirPath = await this.dialogService.showOpenDirectoryDialog()
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
