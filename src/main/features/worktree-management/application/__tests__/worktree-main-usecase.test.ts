import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorktreeMainUseCase } from '../worktree-main-usecase'
import type { IWorktreeGitService } from '../worktree-interfaces'
import type { WorktreeInfo, WorktreeStatus } from '@shared/domain'

function createMockGitService(): IWorktreeGitService {
  return {
    listWorktrees: vi.fn(),
    getStatus: vi.fn(),
    addWorktree: vi.fn(),
    removeWorktree: vi.fn(),
    isMainWorktree: vi.fn(),
    isDirty: vi.fn(),
  }
}

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

describe('WorktreeMainUseCase', () => {
  let useCase: WorktreeMainUseCase
  let gitService: ReturnType<typeof createMockGitService>

  beforeEach(() => {
    gitService = createMockGitService()
    useCase = new WorktreeMainUseCase(gitService)
  })

  describe('list', () => {
    it('ワークツリー一覧を取得し、各 dirty 状態を並列チェックする', async () => {
      const wt1 = createWorktreeInfo({ path: '/repo', isMain: true })
      const wt2 = createWorktreeInfo({ path: '/repo+feat', branch: 'feat', isMain: false })
      vi.mocked(gitService.listWorktrees).mockResolvedValue([wt1, wt2])
      vi.mocked(gitService.isDirty).mockImplementation(async (p) =>
        p === '/repo+feat' ? true : false,
      )

      const result = await useCase.list('/repo')

      expect(result).toHaveLength(2)
      expect(result[0].isDirty).toBe(false)
      expect(result[1].isDirty).toBe(true)
      expect(gitService.isDirty).toHaveBeenCalledTimes(2)
    })
  })

  describe('getStatus', () => {
    it('worktreePath の詳細ステータスを返す', async () => {
      const status: WorktreeStatus = {
        worktree: createWorktreeInfo(),
        staged: [],
        unstaged: [{ path: 'file.ts', status: 'modified' }],
        untracked: [],
      }
      vi.mocked(gitService.getStatus).mockResolvedValue(status)

      const result = await useCase.getStatus('/repo', '/repo')

      expect(result).toEqual(status)
      expect(gitService.getStatus).toHaveBeenCalledWith('/repo')
    })
  })

  describe('create', () => {
    it('ワークツリーを作成する', async () => {
      const created = createWorktreeInfo({ path: '/repo+new', branch: 'new', isMain: false })
      vi.mocked(gitService.addWorktree).mockResolvedValue(created)
      const params = {
        repoPath: '/repo',
        worktreePath: '/repo+new',
        branch: 'new',
        createNewBranch: true,
      }

      const result = await useCase.create(params)

      expect(result).toEqual(created)
      expect(gitService.addWorktree).toHaveBeenCalledWith(params)
    })
  })

  describe('delete', () => {
    it('非メインワークツリーを削除する', async () => {
      vi.mocked(gitService.isMainWorktree).mockResolvedValue(false)
      vi.mocked(gitService.removeWorktree).mockResolvedValue(undefined)

      await useCase.delete({ repoPath: '/repo', worktreePath: '/repo+feat', force: false })

      expect(gitService.removeWorktree).toHaveBeenCalledWith('/repo+feat', false)
    })

    it('メインワークツリーの削除を防止する', async () => {
      vi.mocked(gitService.isMainWorktree).mockResolvedValue(true)

      await expect(
        useCase.delete({ repoPath: '/repo', worktreePath: '/repo', force: false }),
      ).rejects.toThrow('メインワークツリーは削除できません')

      expect(gitService.removeWorktree).not.toHaveBeenCalled()
    })

    it('force=true の場合も渡される', async () => {
      vi.mocked(gitService.isMainWorktree).mockResolvedValue(false)
      vi.mocked(gitService.removeWorktree).mockResolvedValue(undefined)

      await useCase.delete({ repoPath: '/repo', worktreePath: '/repo+feat', force: true })

      expect(gitService.removeWorktree).toHaveBeenCalledWith('/repo+feat', true)
    })
  })

  describe('suggestPath', () => {
    it('親ディレクトリ + リポ名 + ブランチ名でパスを提案する', async () => {
      const result = await useCase.suggestPath('/home/user/myrepo', 'feature/foo')

      expect(result).toBe('/home/user/myrepo+feature-foo')
    })

    it('特殊文字をサニタイズする', async () => {
      const result = await useCase.suggestPath('/home/user/myrepo', 'feat:bar*baz')

      expect(result).toBe('/home/user/myrepo+feat-bar-baz')
    })
  })

  describe('checkDirty', () => {
    it('isDirty を委譲する', async () => {
      vi.mocked(gitService.isDirty).mockResolvedValue(true)

      const result = await useCase.checkDirty('/repo+feat')

      expect(result).toBe(true)
      expect(gitService.isDirty).toHaveBeenCalledWith('/repo+feat')
    })
  })
})
