import type { RecentRepository, RepositoryInfo } from '@domain'
import type { RepositoryRepository } from '../../application/repositories/repository-repository'

export class RepositoryDefaultRepository implements RepositoryRepository {
  async open(): Promise<RepositoryInfo | null> {
    const result = await window.electronAPI.repository.open()
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async openByPath(path: string): Promise<RepositoryInfo | null> {
    const result = await window.electronAPI.repository.openByPath(path)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async validate(path: string): Promise<boolean> {
    const result = await window.electronAPI.repository.validate(path)
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getRecent(): Promise<RecentRepository[]> {
    const result = await window.electronAPI.repository.getRecent()
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async removeRecent(path: string): Promise<void> {
    const result = await window.electronAPI.repository.removeRecent(path)
    if (result.success === false) throw new Error(result.error.message)
  }

  async pin(path: string, pinned: boolean): Promise<void> {
    const result = await window.electronAPI.repository.pin(path, pinned)
    if (result.success === false) throw new Error(result.error.message)
  }
}
