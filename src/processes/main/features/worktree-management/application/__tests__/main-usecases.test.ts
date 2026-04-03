import type { WorktreeInfo, WorktreeStatus } from '@domain'
import type { WorktreeGitRepository } from '../repositories/worktree-git-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckDirtyMainUseCase } from '../usecases/check-dirty-main-usecase'
import { CreateWorktreeMainUseCase } from '../usecases/create-worktree-main-usecase'
import { DeleteWorktreeMainUseCase } from '../usecases/delete-worktree-main-usecase'
import { GetDefaultBranchMainUseCase } from '../usecases/get-default-branch-main-usecase'
import { GetWorktreeStatusMainUseCase } from '../usecases/get-worktree-status-main-usecase'
import { ListWorktreesMainUseCase } from '../usecases/list-worktrees-main-usecase'
import { SuggestPathMainUseCase } from '../usecases/suggest-path-main-usecase'

function createMockGitRepository(): WorktreeGitRepository {
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
  let gitRepository: ReturnType<typeof createMockGitRepository>

  beforeEach(() => {
    gitRepository = createMockGitRepository()
    useCase = new ListWorktreesMainUseCase(gitRepository)
  })

  it('ワークツリー一覧を取得し、各 dirty 状態を並列チェックする', async () => {
    const wt1 = createWorktreeInfo({ path: '/repo', isMain: true })
    const wt2 = createWorktreeInfo({ path: '/repo+feat', branch: 'feat', isMain: false })
    vi.mocked(gitRepository.listWorktrees).mockResolvedValue([wt1, wt2])
    vi.mocked(gitRepository.isDirty).mockImplementation(async (p) => p === '/repo+feat')

    const result = await useCase.invoke('/repo')

    expect(result).toHaveLength(2)
    expect(result[0].isDirty).toBe(false)
    expect(result[1].isDirty).toBe(true)
    expect(gitRepository.isDirty).toHaveBeenCalledTimes(2)
  })
})

describe('GetWorktreeStatusMainUseCase', () => {
  it('worktreePath の詳細ステータスを返す', async () => {
    const gitRepository = createMockGitRepository()
    const useCase = new GetWorktreeStatusMainUseCase(gitRepository)
    const status: WorktreeStatus = {
      worktree: createWorktreeInfo(),
      staged: [],
      unstaged: [{ path: 'file.ts', status: 'modified' }],
      untracked: [],
    }
    vi.mocked(gitRepository.getStatus).mockResolvedValue(status)

    const result = await useCase.invoke({ repoPath: '/repo', worktreePath: '/repo' })

    expect(result).toEqual(status)
    expect(gitRepository.getStatus).toHaveBeenCalledWith('/repo')
  })
})

describe('CreateWorktreeMainUseCase', () => {
  it('ワークツリーを作成する', async () => {
    const gitRepository = createMockGitRepository()
    const useCase = new CreateWorktreeMainUseCase(gitRepository)
    const created = createWorktreeInfo({ path: '/repo+new', branch: 'new', isMain: false })
    vi.mocked(gitRepository.addWorktree).mockResolvedValue(created)
    const params = { repoPath: '/repo', worktreePath: '/repo+new', branch: 'new', createNewBranch: true }

    const result = await useCase.invoke(params)

    expect(result).toEqual(created)
    expect(gitRepository.addWorktree).toHaveBeenCalledWith(params)
  })
})

describe('DeleteWorktreeMainUseCase', () => {
  let gitRepository: ReturnType<typeof createMockGitRepository>
  let useCase: DeleteWorktreeMainUseCase

  beforeEach(() => {
    gitRepository = createMockGitRepository()
    useCase = new DeleteWorktreeMainUseCase(gitRepository)
  })

  it('非メインワークツリーを削除する', async () => {
    vi.mocked(gitRepository.isMainWorktree).mockResolvedValue(false)
    vi.mocked(gitRepository.removeWorktree).mockResolvedValue(undefined)

    await useCase.invoke({ repoPath: '/repo', worktreePath: '/repo+feat', force: false })

    expect(gitRepository.removeWorktree).toHaveBeenCalledWith('/repo+feat', false)
  })

  it('メインワークツリーの削除を防止する', async () => {
    vi.mocked(gitRepository.isMainWorktree).mockResolvedValue(true)

    await expect(useCase.invoke({ repoPath: '/repo', worktreePath: '/repo', force: false })).rejects.toThrow(
      'メインワークツリーは削除できません',
    )

    expect(gitRepository.removeWorktree).not.toHaveBeenCalled()
  })

  it('force=true の場合も渡される', async () => {
    vi.mocked(gitRepository.isMainWorktree).mockResolvedValue(false)
    vi.mocked(gitRepository.removeWorktree).mockResolvedValue(undefined)

    await useCase.invoke({ repoPath: '/repo', worktreePath: '/repo+feat', force: true })

    expect(gitRepository.removeWorktree).toHaveBeenCalledWith('/repo+feat', true)
  })
})

describe('SuggestPathMainUseCase', () => {
  it('メインワークツリーのパスをベースにパスを提案する', async () => {
    const gitRepository = createMockGitRepository()
    const useCase = new SuggestPathMainUseCase(gitRepository)
    vi.mocked(gitRepository.listWorktrees).mockResolvedValue([
      createWorktreeInfo({ path: '/home/user/myrepo', isMain: true }),
      createWorktreeInfo({ path: '/home/user/myrepo+other', isMain: false }),
    ])

    const result = await useCase.invoke({ repoPath: '/home/user/myrepo+other', branch: 'feature/foo' })

    expect(result).toBe('/home/user/myrepo+feature-foo')
  })

  it('特殊文字をサニタイズする', async () => {
    const gitRepository = createMockGitRepository()
    const useCase = new SuggestPathMainUseCase(gitRepository)
    vi.mocked(gitRepository.listWorktrees).mockResolvedValue([
      createWorktreeInfo({ path: '/home/user/myrepo', isMain: true }),
    ])

    const result = await useCase.invoke({ repoPath: '/home/user/myrepo', branch: 'feat:bar*baz' })

    expect(result).toBe('/home/user/myrepo+feat-bar-baz')
  })
})

describe('CheckDirtyMainUseCase', () => {
  it('isDirty を委譲する', async () => {
    const gitRepository = createMockGitRepository()
    const useCase = new CheckDirtyMainUseCase(gitRepository)
    vi.mocked(gitRepository.isDirty).mockResolvedValue(true)

    const result = await useCase.invoke('/repo+feat')

    expect(result).toBe(true)
    expect(gitRepository.isDirty).toHaveBeenCalledWith('/repo+feat')
  })
})

describe('GetDefaultBranchMainUseCase', () => {
  it('デフォルトブランチを返す', async () => {
    const gitRepository = createMockGitRepository()
    const useCase = new GetDefaultBranchMainUseCase(gitRepository)
    vi.mocked(gitRepository.getDefaultBranch).mockResolvedValue('main')

    const result = await useCase.invoke('/repo')

    expect(result).toBe('main')
    expect(gitRepository.getDefaultBranch).toHaveBeenCalledWith('/repo')
  })
})
