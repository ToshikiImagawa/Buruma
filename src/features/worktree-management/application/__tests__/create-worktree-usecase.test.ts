import type { WorktreeInfo } from '@domain'
import { describe, expect, it, vi } from 'vitest'
import { CreateWorktreeDefaultUseCase } from '../usecases/create-worktree-usecase'
import { createMockErrorService, createMockRepo, createMockService } from './helpers'

describe('CreateWorktreeUseCase', () => {
  it('成功時は WorktreeCreateResult を返し ErrorNotificationService に通知しない', async () => {
    const expectedResult = {
      worktree: { path: '/wt', branch: 'test' } as WorktreeInfo,
      symlink: { entries: [], totalCreated: 0, totalSkipped: 0, totalFailed: 0 },
    }
    const repo = createMockRepo({ create: vi.fn().mockResolvedValue(expectedResult) })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new CreateWorktreeDefaultUseCase(repo, service, errorService)

    const result = await useCase.invoke({
      repoPath: '/repo',
      worktreePath: '/wt',
      branch: 'test',
      createNewBranch: true,
    })

    expect(result).toBe(expectedResult)
    expect(errorService.notifyError).not.toHaveBeenCalled()
    expect(service.updateWorktrees).toHaveBeenCalled()
  })

  it('失敗時に notifyError を呼び出す', async () => {
    const repo = createMockRepo({
      create: vi.fn().mockRejectedValue(new Error('branch already exists')),
    })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new CreateWorktreeDefaultUseCase(repo, service, errorService)

    await expect(
      useCase.invoke({ repoPath: '/repo', worktreePath: '/wt', branch: 'test', createNewBranch: true }),
    ).rejects.toThrow('branch already exists')

    expect(errorService.notifyError).toHaveBeenCalledWith('ワークツリーの作成に失敗しました', expect.any(Error))
    expect(service.updateWorktrees).not.toHaveBeenCalled()
  })
})
