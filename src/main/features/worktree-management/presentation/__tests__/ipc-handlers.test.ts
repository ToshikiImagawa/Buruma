import type { WorktreeInfo } from '@shared/domain'
import type { IWorktreeGitRepository } from '../../application/repositories/worktree-git-repository'
import { ipcMain } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckDirtyMainUseCase } from '../../application/usecases/check-dirty-main-usecase'
import { CreateWorktreeMainUseCase } from '../../application/usecases/create-worktree-main-usecase'
import { DeleteWorktreeMainUseCase } from '../../application/usecases/delete-worktree-main-usecase'
import { GetDefaultBranchMainUseCase } from '../../application/usecases/get-default-branch-main-usecase'
import { GetWorktreeStatusMainUseCase } from '../../application/usecases/get-worktree-status-main-usecase'
import { ListWorktreesMainUseCase } from '../../application/usecases/list-worktrees-main-usecase'
import { SuggestPathMainUseCase } from '../../application/usecases/suggest-path-main-usecase'
import { registerIPCHandlers } from '../ipc-handlers'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}))

function createMockGitRepository(): IWorktreeGitRepository {
  return {
    listWorktrees: vi.fn(),
    getStatus: vi.fn(),
    addWorktree: vi.fn(),
    removeWorktree: vi.fn(),
    isMainWorktree: vi.fn(),
    isDirty: vi.fn(),
    getDefaultBranch: vi.fn(),
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
  let gitRepository: ReturnType<typeof createMockGitRepository>
  let handlers: Map<string, (...args: unknown[]) => Promise<unknown>>

  beforeEach(() => {
    vi.clearAllMocks()
    handlers = new Map()
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler) => {
      handlers.set(channel, handler as (...args: unknown[]) => Promise<unknown>)
      return undefined as never
    })

    gitRepository = createMockGitRepository()
    registerIPCHandlers(
      new ListWorktreesMainUseCase(gitRepository),
      new GetWorktreeStatusMainUseCase(gitRepository),
      new CreateWorktreeMainUseCase(gitRepository),
      new DeleteWorktreeMainUseCase(gitRepository),
      new SuggestPathMainUseCase(gitRepository),
      new CheckDirtyMainUseCase(gitRepository),
      new GetDefaultBranchMainUseCase(gitRepository),
    )
  })

  afterEach(() => {
    handlers.clear()
  })

  it('全7チャネルが登録される', () => {
    expect(handlers.size).toBe(7)
    expect(handlers.has('worktree:list')).toBe(true)
    expect(handlers.has('worktree:status')).toBe(true)
    expect(handlers.has('worktree:create')).toBe(true)
    expect(handlers.has('worktree:delete')).toBe(true)
    expect(handlers.has('worktree:suggest-path')).toBe(true)
    expect(handlers.has('worktree:check-dirty')).toBe(true)
    expect(handlers.has('worktree:default-branch')).toBe(true)
  })

  describe('worktree:list', () => {
    it('成功時に IPCResult<WorktreeInfo[]> を返す', async () => {
      const wt = createWorktreeInfo()
      vi.mocked(gitRepository.listWorktrees).mockResolvedValue([wt])
      vi.mocked(gitRepository.isDirty).mockResolvedValue(false)

      const handler = handlers.get('worktree:list')!
      const result = await handler({}, '/repo')

      expect(result).toEqual({ success: true, data: [{ ...wt, isDirty: false }] })
    })

    it('エラー時に IPCResult failure を返す', async () => {
      vi.mocked(gitRepository.listWorktrees).mockRejectedValue(new Error('git error'))

      const handler = handlers.get('worktree:list')!
      const result = (await handler({}, '/repo')) as { success: boolean; error?: { code: string } }

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('worktree:delete', () => {
    it('メインワークツリー削除でエラーを返す', async () => {
      vi.mocked(gitRepository.isMainWorktree).mockResolvedValue(true)

      const handler = handlers.get('worktree:delete')!
      const result = (await handler({}, { repoPath: '/repo', worktreePath: '/repo', force: false })) as {
        success: boolean
        error?: { message: string }
      }

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('メインワークツリー')
    })
  })

  describe('worktree:suggest-path', () => {
    it('メインワークツリーをベースにパスを提案する', async () => {
      vi.mocked(gitRepository.listWorktrees).mockResolvedValue([
        createWorktreeInfo({ path: '/home/user/myrepo', isMain: true }),
      ])

      const handler = handlers.get('worktree:suggest-path')!
      const result = (await handler({}, { repoPath: '/home/user/myrepo', branch: 'feature/foo' })) as {
        success: boolean
        data: string
      }

      expect(result.success).toBe(true)
      expect(result.data).toBe('/home/user/myrepo+feature-foo')
    })
  })

  describe('worktree:default-branch', () => {
    it('デフォルトブランチを返す', async () => {
      vi.mocked(gitRepository.getDefaultBranch).mockResolvedValue('main')

      const handler = handlers.get('worktree:default-branch')!
      const result = await handler({}, '/repo')

      expect(result).toEqual({ success: true, data: 'main' })
    })
  })
})
