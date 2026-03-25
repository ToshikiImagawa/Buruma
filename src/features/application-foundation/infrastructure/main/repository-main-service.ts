import type { IPCResult } from '@/types/ipc'
import type { RecentRepository, RepositoryInfo } from '../../domain'
import type { AppStore } from './store-schema'
import { execFile } from 'child_process'
import path from 'path'
import { promisify } from 'util'
import { dialog } from 'electron'
import { ipcFailure, ipcSuccess } from '@/types/ipc'

const execFileAsync = promisify(execFile)

const MAX_RECENT = 20

export class RepositoryMainService {
  constructor(private readonly store: AppStore) {}

  async openWithDialog(): Promise<IPCResult<RepositoryInfo | null>> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'リポジトリを選択',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return ipcSuccess(null)
    }

    return this.openByPath(result.filePaths[0])
  }

  async openByPath(dirPath: string): Promise<IPCResult<RepositoryInfo | null>> {
    const isValid = await this.isGitRepository(dirPath)
    if (!isValid) {
      return ipcFailure('INVALID_REPOSITORY', '選択されたフォルダは有効な Git リポジトリではありません')
    }

    const repoInfo: RepositoryInfo = {
      path: dirPath,
      name: path.basename(dirPath),
      isValid: true,
    }

    this.addToRecent(repoInfo)
    return ipcSuccess(repoInfo)
  }

  async validate(dirPath: string): Promise<IPCResult<boolean>> {
    const isValid = await this.isGitRepository(dirPath)
    return ipcSuccess(isValid)
  }

  async getRecent(): Promise<IPCResult<RecentRepository[]>> {
    const recent = this.store.get('recentRepositories', [])
    return ipcSuccess(recent)
  }

  async removeRecent(repoPath: string): Promise<IPCResult<void>> {
    const recent = this.store.get('recentRepositories', [])
    this.store.set(
      'recentRepositories',
      recent.filter((r) => r.path !== repoPath),
    )
    return ipcSuccess(undefined)
  }

  async pin(repoPath: string, pinned: boolean): Promise<IPCResult<void>> {
    const recent = this.store.get('recentRepositories', [])
    const updated = recent.map((r) => (r.path === repoPath ? { ...r, pinned } : r))
    this.store.set('recentRepositories', updated)
    return ipcSuccess(undefined)
  }

  private async isGitRepository(dirPath: string): Promise<boolean> {
    try {
      await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dirPath })
      return true
    } catch {
      return false
    }
  }

  private addToRecent(repo: RepositoryInfo): void {
    const recent = this.store.get('recentRepositories', [])
    const filtered = recent.filter((r) => r.path !== repo.path)
    const entry: RecentRepository = {
      path: repo.path,
      name: repo.name,
      lastAccessed: new Date().toISOString(),
      pinned: recent.find((r) => r.path === repo.path)?.pinned ?? false,
    }
    const updated = [entry, ...filtered].slice(0, MAX_RECENT)
    this.store.set('recentRepositories', updated)
  }
}
