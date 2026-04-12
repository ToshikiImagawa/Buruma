import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { WorktreeInfo } from '@domain'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'
import { describe, expect, it, vi } from 'vitest'
import { CreateWorktreeDefaultUseCase } from '../usecases/create-worktree-usecase'

function createMockRepo(overrides: Partial<WorktreeRepository> = {}): WorktreeRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    getStatus: vi.fn(),
    create: vi.fn().mockResolvedValue({} as WorktreeInfo),
    delete: vi.fn(),
    suggestPath: vi.fn(),
    checkDirty: vi.fn(),
    getBranches: vi.fn(),
    onChanged: vi.fn(),
    ...overrides,
  } as WorktreeRepository
}

function createMockService(): WorktreeService {
  return {
    worktrees$: null!,
    selectedWorktreePath$: null!,
    sortOrder$: null!,
    recoveryRequest$: null!,
    updateWorktrees: vi.fn(),
    setSelectedWorktree: vi.fn(),
    setSortOrder: vi.fn(),
    requestRecovery: vi.fn(),
    clearRecovery: vi.fn(),
    setUp: vi.fn(),
    tearDown: vi.fn(),
  }
}

function createMockErrorService(): ErrorNotificationService {
  return {
    notifications$: null!,
    addNotification: vi.fn(),
    notifyError: vi.fn(),
    removeNotification: vi.fn(),
    clear: vi.fn(),
    setUp: vi.fn(),
    tearDown: vi.fn(),
  }
}

describe('CreateWorktreeUseCase', () => {
  it('成功時は ErrorNotificationService に通知しない', async () => {
    const repo = createMockRepo()
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new CreateWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke({ repoPath: '/repo', worktreePath: '/wt', branch: 'test', createNewBranch: true })
    await vi.waitFor(() => expect(service.updateWorktrees).toHaveBeenCalled())

    expect(errorService.notifyError).not.toHaveBeenCalled()
  })

  it('失敗時に notifyError を呼び出す', async () => {
    const repo = createMockRepo({
      create: vi.fn().mockRejectedValue(new Error('branch already exists')),
    })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new CreateWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke({ repoPath: '/repo', worktreePath: '/wt', branch: 'test', createNewBranch: true })
    await vi.waitFor(() => expect(errorService.notifyError).toHaveBeenCalled())

    expect(errorService.notifyError).toHaveBeenCalledWith('ワークツリーの作成に失敗しました', expect.any(Error))
    expect(service.updateWorktrees).not.toHaveBeenCalled()
  })
})
