import type { BranchDeleteResult } from '@domain'
import { describe, expect, it, vi } from 'vitest'
import { DeleteWorktreeDefaultUseCase } from '../usecases/delete-worktree-usecase'
import { TestWorktreeError, createMockErrorService, createMockRepo, createMockService } from './helpers'

const baseParams = { repoPath: '/repo', worktreePath: '/wt', force: false, deleteBranch: false }

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

  // --- FR_103_05: ブランチ同時削除テスト ---

  describe('FR_103_05: ブランチ同時削除', () => {
    const branchParams = { ...baseParams, deleteBranch: true }

    it('ブランチ削除成功時はリカバリーを発行しない', async () => {
      const branchResult: BranchDeleteResult = { type: 'deleted', branchName: 'feature/test' }
      const repo = createMockRepo({ delete: vi.fn().mockResolvedValue(branchResult) })
      const service = createMockService()
      const errorService = createMockErrorService()
      const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

      useCase.invoke(branchParams)
      await vi.waitFor(() => expect(service.updateWorktrees).toHaveBeenCalled())

      expect(service.requestRecovery).not.toHaveBeenCalled()
      expect(errorService.notifyError).not.toHaveBeenCalled()
    })

    it('ブランチ削除がスキップされた場合もリカバリーを発行しない', async () => {
      const branchResult: BranchDeleteResult = {
        type: 'skipped',
        branchName: 'feature/test',
        skipReason: '他のワークツリーで使用中です',
      }
      const repo = createMockRepo({ delete: vi.fn().mockResolvedValue(branchResult) })
      const service = createMockService()
      const errorService = createMockErrorService()
      const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

      useCase.invoke(branchParams)
      await vi.waitFor(() => expect(service.updateWorktrees).toHaveBeenCalled())

      expect(service.requestRecovery).not.toHaveBeenCalled()
      expect(errorService.notifyError).not.toHaveBeenCalled()
    })

    it('未マージブランチ (requireForce) でリカバリーダイアログを表示する', async () => {
      const branchResult: BranchDeleteResult = { type: 'requireForce', branchName: 'feature/unmerged' }
      const repo = createMockRepo({ delete: vi.fn().mockResolvedValue(branchResult) })
      const service = createMockService()
      const errorService = createMockErrorService()
      const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

      useCase.invoke(branchParams)
      await vi.waitFor(() => expect(service.requestRecovery).toHaveBeenCalled())

      expect(service.requestRecovery).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'ブランチの削除に失敗しました',
          confirmLabel: '強制削除',
          onConfirm: expect.any(Function),
        }),
      )
    })

    it('未マージブランチのリカバリー確認後に forceDeleteBranch が呼ばれる', async () => {
      const branchResult: BranchDeleteResult = { type: 'requireForce', branchName: 'feature/unmerged' }
      const repo = createMockRepo({ delete: vi.fn().mockResolvedValue(branchResult) })
      const service = createMockService()
      const errorService = createMockErrorService()
      const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

      useCase.invoke(branchParams)
      await vi.waitFor(() => expect(service.requestRecovery).toHaveBeenCalled())

      // リカバリーダイアログの onConfirm を実行
      const recoveryCall = vi.mocked(service.requestRecovery).mock.calls[0][0]
      recoveryCall.onConfirm()

      await vi.waitFor(() => expect(repo.forceDeleteBranch).toHaveBeenCalledWith('/repo', 'feature/unmerged'))
    })

    it('deleteBranch=false の場合はブランチ削除結果が null でもリカバリーを発行しない', async () => {
      const repo = createMockRepo({ delete: vi.fn().mockResolvedValue(null) })
      const service = createMockService()
      const errorService = createMockErrorService()
      const useCase = new DeleteWorktreeDefaultUseCase(repo, service, errorService)

      useCase.invoke(baseParams)
      await vi.waitFor(() => expect(service.updateWorktrees).toHaveBeenCalled())

      expect(service.requestRecovery).not.toHaveBeenCalled()
      expect(errorService.notifyError).not.toHaveBeenCalled()
    })
  })
})
