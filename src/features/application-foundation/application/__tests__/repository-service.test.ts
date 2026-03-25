import type { RecentRepository, RepositoryInfo } from '../../domain'
import { firstValueFrom } from 'rxjs'
import { describe, expect, it } from 'vitest'
import { RepositoryService } from '../repository-service'

describe('RepositoryService', () => {
  it('初期値は currentRepository$ が null', async () => {
    const service = new RepositoryService()
    const value = await firstValueFrom(service.currentRepository$)
    expect(value).toBeNull()
  })

  it('初期値は recentRepositories$ が空配列', async () => {
    const service = new RepositoryService()
    const value = await firstValueFrom(service.recentRepositories$)
    expect(value).toEqual([])
  })

  it('setCurrentRepository で currentRepository$ が更新される', async () => {
    const service = new RepositoryService()
    const repo: RepositoryInfo = { path: '/test', name: 'test', isValid: true }
    service.setCurrentRepository(repo)
    const value = await firstValueFrom(service.currentRepository$)
    expect(value).toEqual(repo)
  })

  it('updateRecentRepositories で recentRepositories$ が更新される', async () => {
    const service = new RepositoryService()
    const repos: RecentRepository[] = [
      { path: '/test', name: 'test', lastAccessed: '2026-01-01T00:00:00Z', pinned: false },
    ]
    service.updateRecentRepositories(repos)
    const value = await firstValueFrom(service.recentRepositories$)
    expect(value).toEqual(repos)
  })

  it('setCurrentRepository(null) で currentRepository$ が null に戻る', async () => {
    const service = new RepositoryService()
    const repo: RepositoryInfo = { path: '/test', name: 'test', isValid: true }
    service.setCurrentRepository(repo)
    service.setCurrentRepository(null)
    const value = await firstValueFrom(service.currentRepository$)
    expect(value).toBeNull()
  })

  it('dispose で BehaviorSubject が complete される', () => {
    const service = new RepositoryService()
    let completed = false
    service.currentRepository$.subscribe({ complete: () => (completed = true) })
    service.dispose()
    expect(completed).toBe(true)
  })
})
