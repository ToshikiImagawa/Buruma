import { describe, expect, it, vi } from 'vitest'
import { DeleteWorktreeDefaultUseCase } from '../usecases/delete-worktree-usecase'
import { TestWorktreeError, createMockErrorService, createMockRepo, createMockService } from './helpers'

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

  it('WORKTREE_DIRTY エラー (force=false) でリカバリーダイアログを要求する', async () => {
    const error = new TestWorktreeError({ code: 'WORKTREE_DIRTY', message: 'dirty worktree' })
    const repo = createMockRepo({ delete: vi.fn().mockRejectedValue(error) })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke(baseParams)
    await vi.waitFor(() => expect(service.requestRecovery).toHaveBeenCalled())

    expect(service.requestRecovery).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmLabel: '強制削除',
        onConfirm: expect.any(Function),
      }),
    )
    expect(errorService.notifyError).not.toHaveBeenCalled()
  })

  it('force=true で失敗した場合はリカバリーではなくトーストを表示する', async () => {
    const error = new TestWorktreeError({ code: 'WORKTREE_DIRTY', message: 'still dirty' })
    const repo = createMockRepo({ delete: vi.fn().mockRejectedValue(error) })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke({ ...baseParams, force: true })
    await vi.waitFor(() => expect(errorService.notifyError).toHaveBeenCalled())

    expect(errorService.notifyError).toHaveBeenCalledWith('ワークツリーの削除に失敗しました', expect.any(Error))
    expect(service.requestRecovery).not.toHaveBeenCalled()
  })

  it('WORKTREE_DIRTY 以外のエラーはトーストを表示する', async () => {
    const error = new TestWorktreeError({ code: 'GIT_ERROR', message: 'worktree not found' })
    const repo = createMockRepo({ delete: vi.fn().mockRejectedValue(error) })
    const service = createMockService()
    const errorService = createMockErrorService()
    const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

    useCase.invoke(baseParams)
    await vi.waitFor(() => expect(errorService.notifyError).toHaveBeenCalled())

    expect(errorService.notifyError).toHaveBeenCalledWith('ワークツリーの削除に失敗しました', expect.any(Error))
    expect(service.requestRecovery).not.toHaveBeenCalled()
  })
})
