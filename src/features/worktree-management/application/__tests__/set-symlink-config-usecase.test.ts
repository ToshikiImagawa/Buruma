import { describe, expect, it, vi } from 'vitest'
import { SetSymlinkConfigDefaultUseCase } from '../usecases/set-symlink-config-usecase'
import { createMockErrorService, createMockRepo } from './helpers'

describe('SetSymlinkConfigUseCase', () => {
  it('成功時はリポジトリの setSymlinkConfig を呼び出し、notifyError を呼ばない', async () => {
    const repo = createMockRepo()
    const errorService = createMockErrorService()
    const useCase = new SetSymlinkConfigDefaultUseCase(repo, errorService)

    await useCase.invoke({
      repoPath: '/repo/path',
      config: { patterns: ['node_modules'], source: 'repo' },
    })

    expect(repo.setSymlinkConfig).toHaveBeenCalledWith('/repo/path', {
      patterns: ['node_modules'],
      source: 'repo',
    })
    expect(errorService.notifyError).not.toHaveBeenCalled()
  })

  it('失敗時に notifyError を呼び出し、エラーを再 throw する', async () => {
    const repo = createMockRepo({
      setSymlinkConfig: vi.fn().mockRejectedValue(new Error('write failed')),
    })
    const errorService = createMockErrorService()
    const useCase = new SetSymlinkConfigDefaultUseCase(repo, errorService)

    await expect(
      useCase.invoke({
        repoPath: '/repo/path',
        config: { patterns: ['.env'], source: 'app' },
      }),
    ).rejects.toThrow('write failed')

    expect(errorService.notifyError).toHaveBeenCalledWith(
      'シンボリックリンク設定の保存に失敗しました',
      expect.any(Error),
    )
  })
})
