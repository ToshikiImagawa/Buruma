import type { WorktreeInfo, WorktreeStatus } from '@shared/domain'
import type { IWorktreeGitService } from '../worktree-interfaces'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckDirtyMainUseCase } from '../usecases/check-dirty-main-usecase'
import { CreateWorktreeMainUseCase } from '../usecases/create-worktree-main-usecase'
import { DeleteWorktreeMainUseCase } from '../usecases/delete-worktree-main-usecase'
import { GetDefaultBranchMainUseCase } from '../usecases/get-default-branch-main-usecase'
import { GetWorktreeStatusMainUseCase } from '../usecases/get-worktree-status-main-usecase'
import { ListWorktreesMainUseCase } from '../usecases/list-worktrees-main-usecase'
import { SuggestPathMainUseCase } from '../usecases/suggest-path-main-usecase'

function createMockGitService(): IWorktreeGitService {
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

describe('ListWorktreesMainUseCase', () => {
  let useCase: ListWorktreesMainUseCase
  let gitService: ReturnType<typeof createMockGitService>

  beforeEach(() => {
    gitService = createMockGitService()
    useCase = new ListWorktreesMainUseCase(gitService)
  })

  it('ワークツリー一覧を取得し、各 dirty 状態を並列チェックする', async () => {
    const wt1 = createWorktreeInfo({ path: '/repo', isMain: true })
    const wt2 = createWorktreeInfo({ path: '/repo+feat', branch: 'feat', isMain: false })
    vi.mocked(gitService.listWorktrees).mockResolvedValue([wt1, wt2])
    vi.mocked(gitService.isDirty).mockImplementation(async (p) => (p === '/repo+feat' ? true : false))

    const result = await useCase.invoke('/repo')

    expect(result).toHaveLength(2)
    expect(result[0].isDirty).toBe(false)
    expect(result[1].isDirty).toBe(true)
    expect(gitService.isDirty).toHaveBeenCalledTimes(2)
  })
})

describe('GetWorktreeStatusMainUseCase', () => {
  it('worktreePath の詳細ステータスを返す', async () => {
    const gitService = createMockGitService()
    const useCase = new GetWorktreeStatusMainUseCase(gitService)
    const status: WorktreeStatus = {
      worktree: createWorktreeInfo(),
      staged: [],
      unstaged: [{ path: 'file.ts', status: 'modified' }],
      untracked: [],
    }
    vi.mocked(gitService.getStatus).mockResolvedValue(status)

    const result = await useCase.invoke({ repoPath: '/repo', worktreePath: '/repo' })

    expect(result).toEqual(status)
    expect(gitService.getStatus).toHaveBeenCalledWith('/repo')
  })
})

describe('CreateWorktreeMainUseCase', () => {
  it('ワークツリーを作成する', async () => {
    const gitService = createMockGitService()
    const useCase = new CreateWorktreeMainUseCase(gitService)
    const created = createWorktreeInfo({ path: '/repo+new', branch: 'new', isMain: false })
    vi.mocked(gitService.addWorktree).mockResolvedValue(created)
    const params = { repoPath: '/repo', worktreePath: '/repo+new', branch: 'new', createNewBranch: true }

    const result = await useCase.invoke(params)

    expect(result).toEqual(created)
    expect(gitService.addWorktree).toHaveBeenCalledWith(params)
  })
})

describe('DeleteWorktreeMainUseCase', () => {
  let gitService: ReturnType<typeof createMockGitService>
  let useCase: DeleteWorktreeMainUseCase

  beforeEach(() => {
    gitService = createMockGitService()
    useCase = new DeleteWorktreeMainUseCase(gitService)
  })

  it('非メインワークツリーを削除する', async () => {
    vi.mocked(gitService.isMainWorktree).mockResolvedValue(false)
    vi.mocked(gitService.removeWorktree).mockResolvedValue(undefined)

    await useCase.invoke({ repoPath: '/repo', worktreePath: '/repo+feat', force: false })

    expect(gitService.removeWorktree).toHaveBeenCalledWith('/repo+feat', false)
  })

  it('メインワークツリーの削除を防止する', async () => {
    vi.mocked(gitService.isMainWorktree).mockResolvedValue(true)

    await expect(useCase.invoke({ repoPath: '/repo', worktreePath: '/repo', force: false })).rejects.toThrow(
      'メインワークツリーは削除できません',
    )

    expect(gitService.removeWorktree).not.toHaveBeenCalled()
  })

  it('force=true の場合も渡される', async () => {
    vi.mocked(gitService.isMainWorktree).mockResolvedValue(false)
    vi.mocked(gitService.removeWorktree).mockResolvedValue(undefined)

    await useCase.invoke({ repoPath: '/repo', worktreePath: '/repo+feat', force: true })

    expect(gitService.removeWorktree).toHaveBeenCalledWith('/repo+feat', true)
  })
})

describe('SuggestPathMainUseCase', () => {
  it('メインワークツリーのパスをベースにパスを提案する', async () => {
    const gitService = createMockGitService()
    const useCase = new SuggestPathMainUseCase(gitService)
    vi.mocked(gitService.listWorktrees).mockResolvedValue([
      createWorktreeInfo({ path: '/home/user/myrepo', isMain: true }),
      createWorktreeInfo({ path: '/home/user/myrepo+other', isMain: false }),
    ])

    const result = await useCase.invoke({ repoPath: '/home/user/myrepo+other', branch: 'feature/foo' })

    expect(result).toBe('/home/user/myrepo+feature-foo')
  })

  it('特殊文字をサニタイズする', async () => {
    const gitService = createMockGitService()
    const useCase = new SuggestPathMainUseCase(gitService)
    vi.mocked(gitService.listWorktrees).mockResolvedValue([
      createWorktreeInfo({ path: '/home/user/myrepo', isMain: true }),
    ])

    const result = await useCase.invoke({ repoPath: '/home/user/myrepo', branch: 'feat:bar*baz' })

    expect(result).toBe('/home/user/myrepo+feat-bar-baz')
  })
})

describe('CheckDirtyMainUseCase', () => {
  it('isDirty を委譲する', async () => {
    const gitService = createMockGitService()
    const useCase = new CheckDirtyMainUseCase(gitService)
    vi.mocked(gitService.isDirty).mockResolvedValue(true)

    const result = await useCase.invoke('/repo+feat')

    expect(result).toBe(true)
    expect(gitService.isDirty).toHaveBeenCalledWith('/repo+feat')
  })
})

describe('GetDefaultBranchMainUseCase', () => {
  it('デフォルトブランチを返す', async () => {
    const gitService = createMockGitService()
    const useCase = new GetDefaultBranchMainUseCase(gitService)
    vi.mocked(gitService.getDefaultBranch).mockResolvedValue('main')

    const result = await useCase.invoke('/repo')

    expect(result).toBe('main')
    expect(gitService.getDefaultBranch).toHaveBeenCalledWith('/repo')
  })
})
