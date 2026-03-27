import type { RecentRepository, RepositoryInfo } from '@/shared/domain'
import path from 'path'
import type { IDialogService, IGitRepositoryValidator, IStoreRepository } from './repository-interfaces'

const MAX_RECENT = 20

export class RepositoryMainUseCase {
  constructor(
    private readonly store: IStoreRepository,
    private readonly gitValidator: IGitRepositoryValidator,
    private readonly dialogService: IDialogService,
  ) {}

  async openWithDialog(): Promise<RepositoryInfo | null> {
    const dirPath = await this.dialogService.showOpenDirectoryDialog()
    if (!dirPath) return null
    return this.openByPath(dirPath)
  }

  async openByPath(dirPath: string): Promise<RepositoryInfo | null> {
    const isValid = await this.gitValidator.isGitRepository(dirPath)
    if (!isValid) return null

    const repoInfo: RepositoryInfo = {
      path: dirPath,
      name: path.basename(dirPath),
      isValid: true,
    }

    this.addToRecent(repoInfo)
    return repoInfo
  }

  async validate(dirPath: string): Promise<boolean> {
    return this.gitValidator.isGitRepository(dirPath)
  }

  getRecent(): RecentRepository[] {
    return this.store.getRecentRepositories()
  }

  removeRecent(repoPath: string): void {
    const recent = this.store.getRecentRepositories()
    this.store.setRecentRepositories(recent.filter((r) => r.path !== repoPath))
  }

  pin(repoPath: string, pinned: boolean): void {
    const recent = this.store.getRecentRepositories()
    const updated = recent.map((r) => (r.path === repoPath ? { ...r, pinned } : r))
    this.store.setRecentRepositories(updated)
  }

  private addToRecent(repo: RepositoryInfo): void {
    const recent = this.store.getRecentRepositories()
    const filtered = recent.filter((r) => r.path !== repo.path)
    const entry: RecentRepository = {
      path: repo.path,
      name: repo.name,
      lastAccessed: new Date().toISOString(),
      pinned: recent.find((r) => r.path === repo.path)?.pinned ?? false,
    }
    const updated = [entry, ...filtered].slice(0, MAX_RECENT)
    this.store.setRecentRepositories(updated)
  }
}
