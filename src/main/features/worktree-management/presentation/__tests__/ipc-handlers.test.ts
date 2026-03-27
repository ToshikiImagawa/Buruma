import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ipcMain } from 'electron'
import { WorktreeMainUseCase } from '../../application/worktree-main-usecase'
import type { IWorktreeGitService } from '../../application/worktree-interfaces'
import { registerIPCHandlers } from '../ipc-handlers'
import type { WorktreeInfo } from '@shared/domain'

// ipcMain.handle をモック
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}))

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

describe('IPC Handlers 結合テスト', () => {
  let gitService: ReturnType<typeof createMockGitService>
  let useCase: WorktreeMainUseCase
  let handlers: Map<string, (...args: unknown[]) => Promise<unknown>>

  beforeEach(() => {
    vi.clearAllMocks()
    handlers = new Map()
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler) => {
      handlers.set(channel, handler as (...args: unknown[]) => Promise<unknown>)
      return undefined as never
    })

    gitService = createMockGitService()
    useCase = new WorktreeMainUseCase(gitService)
    registerIPCHandlers(useCase)
  })

  afterEach(() => {
    handlers.clear()
  })

  it('全6チャネルが登録される', () => {
    expect(handlers.size).toBe(6)
    expect(handlers.has('worktree:list')).toBe(true)
    expect(handlers.has('worktree:status')).toBe(true)
    expect(handlers.has('worktree:create')).toBe(true)
    expect(handlers.has('worktree:delete')).toBe(true)
    expect(handlers.has('worktree:suggest-path')).toBe(true)
    expect(handlers.has('worktree:check-dirty')).toBe(true)
  })

  describe('worktree:list', () => {
    it('成功時に IPCResult<WorktreeInfo[]> を返す', async () => {
      const wt = createWorktreeInfo()
      vi.mocked(gitService.listWorktrees).mockResolvedValue([wt])
      vi.mocked(gitService.isDirty).mockResolvedValue(false)

      const handler = handlers.get('worktree:list')!
      const result = await handler({}, '/repo')

      expect(result).toEqual({
        success: true,
        data: [{ ...wt, isDirty: false }],
      })
    })

    it('エラー時に IPCResult failure を返す', async () => {
      vi.mocked(gitService.listWorktrees).mockRejectedValue(new Error('git error'))

      const handler = handlers.get('worktree:list')!
      const result = (await handler({}, '/repo')) as { success: boolean; error?: { code: string } }

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('worktree:create', () => {
    it('UseCase.create を呼び出し、結果を返す', async () => {
      const created = createWorktreeInfo({ path: '/repo+new', branch: 'new', isMain: false })
      vi.mocked(gitService.addWorktree).mockResolvedValue(created)

      const handler = handlers.get('worktree:create')!
      const params = {
        repoPath: '/repo',
        worktreePath: '/repo+new',
        branch: 'new',
        createNewBranch: true,
      }
      const result = await handler({}, params)

      expect(result).toEqual({ success: true, data: created })
    })
  })

  describe('worktree:delete', () => {
    it('メインワークツリー削除でエラーを返す', async () => {
      vi.mocked(gitService.isMainWorktree).mockResolvedValue(true)

      const handler = handlers.get('worktree:delete')!
      const result = (await handler({}, {
        repoPath: '/repo',
        worktreePath: '/repo',
        force: false,
      })) as { success: boolean; error?: { message: string } }

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('メインワークツリー')
    })

    it('非メインワークツリーを正常に削除する', async () => {
      vi.mocked(gitService.isMainWorktree).mockResolvedValue(false)
      vi.mocked(gitService.removeWorktree).mockResolvedValue(undefined)

      const handler = handlers.get('worktree:delete')!
      const result = await handler({}, {
        repoPath: '/repo',
        worktreePath: '/repo+feat',
        force: false,
      })

      expect(result).toEqual({ success: true, data: undefined })
    })
  })

  describe('worktree:suggest-path', () => {
    it('パスを提案する', async () => {
      const handler = handlers.get('worktree:suggest-path')!
      const result = (await handler({}, {
        repoPath: '/home/user/myrepo',
        branch: 'feature/foo',
      })) as { success: boolean; data: string }

      expect(result.success).toBe(true)
      expect(result.data).toBe('/home/user/myrepo+feature-foo')
    })
  })

  describe('worktree:check-dirty', () => {
    it('dirty 状態を返す', async () => {
      vi.mocked(gitService.isDirty).mockResolvedValue(true)

      const handler = handlers.get('worktree:check-dirty')!
      const result = await handler({}, '/repo+feat')

      expect(result).toEqual({ success: true, data: true })
    })
  })
})
