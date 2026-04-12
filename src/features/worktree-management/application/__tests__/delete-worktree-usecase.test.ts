import type { ErrorNotificationService } from '@/features/application-foundation/application/services/error-notification-service-interface'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import type { WorktreeService } from '../services/worktree-service-interface'
import { describe, expect, it, vi } from 'vitest'
import { DeleteWorktreeDefaultUseCase } from '../usecases/delete-worktree-usecase'

function createMockRepo(overrides: Partial<WorktreeRepository> = {}): WorktreeRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    getStatus: vi.fn(),
    create: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
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

const baseParams = { repoPath: '/repo', worktreePath: '/wt', force: false }

describe('DeleteWorktreeUseCase', () => {
  it('成功時は通知もリカバリーも発行しない', async () => {
    const repo = createMockRepo()
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke(baseParams)
    await vi.waitFor(() => expect(service.updateWorktrees).toHaveBeenCalled())

    expect(errorService.notifyError).not.toHaveBeenCalled()
    expect(service.requestRecovery).not.toHaveBeenCalled()
  })

  it('dirty worktree エラー (force=false) でリカバリーダイアログを要求する', async () => {
    const repo = createMockRepo({
      delete: vi.fn().mockRejectedValue(new Error('cannot remove a dirty worktree; use --force to override')),
    })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke(baseParams)
    await vi.waitFor(() => expect(service.requestRecovery).toHaveBeenCalled())

    expect(service.requestRecovery).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmLabel: '強制削除',
        params: { ...baseParams, force: true },
      }),
    )
    expect(errorService.notifyError).not.toHaveBeenCalled()
  })

  it('force=true で失敗した場合はリカバリーではなくトーストを表示する', async () => {
    const repo = createMockRepo({
      delete: vi.fn().mockRejectedValue(new Error('permission denied')),
    })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke({ ...baseParams, force: true })
    await vi.waitFor(() => expect(errorService.notifyError).toHaveBeenCalled())

    expect(errorService.notifyError).toHaveBeenCalledWith('ワークツリーの削除に失敗しました', expect.any(Error))
    expect(service.requestRecovery).not.toHaveBeenCalled()
  })

  it('force=false でも --force を含まないエラーはトーストを表示する', async () => {
    const repo = createMockRepo({
      delete: vi.fn().mockRejectedValue(new Error('worktree not found')),
    })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke(baseParams)
    await vi.waitFor(() => expect(errorService.notifyError).toHaveBeenCalled())

    expect(errorService.notifyError).toHaveBeenCalledWith('ワークツリーの削除に失敗しました', expect.any(Error))
    expect(service.requestRecovery).not.toHaveBeenCalled()
  })
})
