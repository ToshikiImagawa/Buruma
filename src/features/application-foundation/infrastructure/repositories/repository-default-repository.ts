import type { RecentRepository, RepositoryInfo } from '@domain'
import type { RepositoryRepository } from '../../application/repositories/repository-repository'
import { invokeCommand } from '@lib/invoke/commands'

export class RepositoryDefaultRepository implements RepositoryRepository {
  async open(): Promise<RepositoryInfo | null> {
    const result = await invokeCommand('repository_open')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async openByPath(path: string): Promise<RepositoryInfo | null> {
    const result = await invokeCommand('repository_open_path', { path })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async validate(path: string): Promise<boolean> {
    const result = await invokeCommand('repository_validate', { path })
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async getRecent(): Promise<RecentRepository[]> {
    const result = await invokeCommand('repository_get_recent')
    if (result.success === false) throw new Error(result.error.message)
    return result.data
  }

  async removeRecent(path: string): Promise<void> {
    const result = await invokeCommand('repository_remove_recent', { path })
    if (result.success === false) throw new Error(result.error.message)
  }

  async pin(path: string, pinned: boolean): Promise<void> {
    const result = await invokeCommand('repository_pin', { path, pinned })
    if (result.success === false) throw new Error(result.error.message)
  }
}
