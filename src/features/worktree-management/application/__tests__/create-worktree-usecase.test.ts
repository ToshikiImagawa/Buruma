import { describe, expect, it, vi } from 'vitest'
import { CreateWorktreeDefaultUseCase } from '../usecases/create-worktree-usecase'
import { createMockErrorService, createMockRepo, createMockService } from './helpers'

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
