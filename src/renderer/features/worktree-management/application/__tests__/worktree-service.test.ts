import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { firstValueFrom } from 'rxjs'
import { WorktreeService } from '../worktree-service'
import type { WorktreeInfo } from '@shared/domain'

function createWorktreeInfo(overrides: Partial<WorktreeInfo> = {}): WorktreeInfo {
  return {
    path: '/repo',
    branch: 'main',
    head: 'abc1234',
    headMessage: 'Initial commit',
    isMain: true,
    isDirty: false,
    ...overrides,
  }
}

describe('WorktreeService', () => {
  let service: WorktreeService

  beforeEach(() => {
    service = new WorktreeService()
  })

  afterEach(() => {
    service.tearDown()
  })

  describe('setUp / tearDown', () => {
    it('初期データで worktrees$ を設定する', async () => {
      const wts = [createWorktreeInfo()]
      service.setUp(wts)

      const result = await firstValueFrom(service.worktrees$)
      expect(result).toHaveLength(1)
      expect(result[0].path).toBe('/repo')
    })
  })

  describe('updateWorktrees', () => {
    it('worktrees$ を更新する', async () => {
      service.setUp([])
      service.updateWorktrees([createWorktreeInfo({ path: '/new' })])

      const result = await firstValueFrom(service.worktrees$)
      expect(result).toHaveLength(1)
      expect(result[0].path).toBe('/new')
    })
  })

  describe('setSelectedWorktree', () => {
    it('selectedWorktreePath$ を更新する', async () => {
      service.setUp([])
      service.setSelectedWorktree('/repo+feat')

      const result = await firstValueFrom(service.selectedWorktreePath$)
      expect(result).toBe('/repo+feat')
    })

    it('null でクリアする', async () => {
      service.setUp([])
      service.setSelectedWorktree('/repo')
      service.setSelectedWorktree(null)

      const result = await firstValueFrom(service.selectedWorktreePath$)
      expect(result).toBeNull()
    })
  })

  describe('setSortOrder', () => {
    it('sortOrder$ を更新する', async () => {
      service.setUp([])
      service.setSortOrder('last-updated')

      const result = await firstValueFrom(service.sortOrder$)
      expect(result).toBe('last-updated')
    })
  })

  describe('sortWorktrees', () => {
    it('name でアルファベット順にソートする', async () => {
      const wts = [
        createWorktreeInfo({ path: '/repo+z-feature' }),
        createWorktreeInfo({ path: '/repo+a-feature' }),
        createWorktreeInfo({ path: '/repo+m-feature' }),
      ]
      service.setUp(wts)
      service.setSortOrder('name')

      const result = await firstValueFrom(service.worktrees$)
      expect(result.map((w) => w.path)).toEqual([
        '/repo+a-feature',
        '/repo+m-feature',
        '/repo+z-feature',
      ])
    })
  })
})
