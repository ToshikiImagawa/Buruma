import type {
  GetBranchesMainUseCase,
  GetCommitDetailMainUseCase,
  GetDiffCommitMainUseCase,
  GetDiffMainUseCase,
  GetDiffStagedMainUseCase,
  GetFileTreeMainUseCase,
  GetLogMainUseCase,
  GetStatusMainUseCase,
} from '../../di-tokens'
import { ipcMain } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerGitIPCHandlers } from '../ipc-handlers'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}))

function createMockUseCase() {
  return { invoke: vi.fn() }
}

describe('registerGitIPCHandlers', () => {
  let getStatusUseCase: GetStatusMainUseCase
  let getLogUseCase: GetLogMainUseCase
  let getCommitDetailUseCase: GetCommitDetailMainUseCase
  let getDiffUseCase: GetDiffMainUseCase
  let getDiffStagedUseCase: GetDiffStagedMainUseCase
  let getDiffCommitUseCase: GetDiffCommitMainUseCase
  let getBranchesUseCase: GetBranchesMainUseCase
  let getFileTreeUseCase: GetFileTreeMainUseCase
  let handlers: Map<string, (...args: unknown[]) => Promise<unknown>>
  let cleanup: () => void

  beforeEach(() => {
    vi.clearAllMocks()
    handlers = new Map()
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler) => {
      handlers.set(channel, handler as (...args: unknown[]) => Promise<unknown>)
      return undefined as never
    })

    getStatusUseCase = createMockUseCase()
    getLogUseCase = createMockUseCase()
    getCommitDetailUseCase = createMockUseCase()
    getDiffUseCase = createMockUseCase()
    getDiffStagedUseCase = createMockUseCase()
    getDiffCommitUseCase = createMockUseCase()
    getBranchesUseCase = createMockUseCase()
    getFileTreeUseCase = createMockUseCase()

    cleanup = registerGitIPCHandlers(
      getStatusUseCase,
      getLogUseCase,
      getCommitDetailUseCase,
      getDiffUseCase,
      getDiffStagedUseCase,
      getDiffCommitUseCase,
      getBranchesUseCase,
      getFileTreeUseCase,
      createMockUseCase(),
      createMockUseCase(),
    )
  })

  afterEach(() => {
    handlers.clear()
  })

  it('全10チャネルが登録される', () => {
    expect(handlers.size).toBe(10)
    expect(handlers.has('git:status')).toBe(true)
    expect(handlers.has('git:log')).toBe(true)
    expect(handlers.has('git:commit-detail')).toBe(true)
    expect(handlers.has('git:diff')).toBe(true)
    expect(handlers.has('git:diff-staged')).toBe(true)
    expect(handlers.has('git:diff-commit')).toBe(true)
    expect(handlers.has('git:branches')).toBe(true)
    expect(handlers.has('git:file-tree')).toBe(true)
    expect(handlers.has('git:file-contents')).toBe(true)
    expect(handlers.has('git:file-contents-commit')).toBe(true)
  })

  it('git:status が成功レスポンスを返す', async () => {
    const statusData = { current: 'main', files: [], ahead: 0, behind: 0 }
    vi.mocked(getStatusUseCase.invoke).mockResolvedValue(statusData)

    const handler = handlers.get('git:status')!
    const result = await handler({}, { worktreePath: '/repo' })

    expect(result).toEqual({ success: true, data: statusData })
    expect(getStatusUseCase.invoke).toHaveBeenCalledWith({ worktreePath: '/repo' })
  })

  it('git:log が成功レスポンスを返す', async () => {
    const logResult = { commits: [], hasMore: false }
    vi.mocked(getLogUseCase.invoke).mockResolvedValue(logResult)

    const handler = handlers.get('git:log')!
    const query = { worktreePath: '/repo', offset: 0, limit: 50 }
    const result = await handler({}, query)

    expect(result).toEqual({ success: true, data: logResult })
    expect(getLogUseCase.invoke).toHaveBeenCalledWith(query)
  })

  it('エラー時に ipcFailure を返す', async () => {
    vi.mocked(getStatusUseCase.invoke).mockRejectedValue(new Error('git error'))

    const handler = handlers.get('git:status')!
    const result = (await handler({}, { worktreePath: '/repo' })) as {
      success: boolean
      error?: { code: string; message: string }
    }

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('INTERNAL_ERROR')
    expect(result.error?.message).toBe('git error')
  })

  it('cleanup で全チャネルが removeHandler される', () => {
    cleanup()

    expect(ipcMain.removeHandler).toHaveBeenCalledTimes(10)
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:status')
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:log')
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:commit-detail')
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:diff')
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:diff-staged')
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:diff-commit')
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:branches')
    expect(ipcMain.removeHandler).toHaveBeenCalledWith('git:file-tree')
  })
})
