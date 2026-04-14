import type { SymlinkConfig } from '@domain'
import { describe, expect, it, vi } from 'vitest'
import { GetSymlinkConfigDefaultUseCase } from '../usecases/get-symlink-config-usecase'
import { SetSymlinkConfigDefaultUseCase } from '../usecases/set-symlink-config-usecase'
import { createMockErrorService, createMockRepo } from './helpers'

describe('GetSymlinkConfigUseCase', () => {
  it('WorktreeRepository.getSymlinkConfig を呼び出して SymlinkConfig を返す', async () => {
    const config: SymlinkConfig = { patterns: ['node_modules', '.env'], source: 'repo' }
    const repo = createMockRepo({ getSymlinkConfig: vi.fn().mockResolvedValue(config) })
    const useCase = new GetSymlinkConfigDefaultUseCase(repo)

    const result = await useCase.invoke('/repo')

    expect(repo.getSymlinkConfig).toHaveBeenCalledWith('/repo')
    expect(result).toEqual(config)
    expect(result.patterns).toHaveLength(2)
  })

  it('Repository がエラーを投げた場合、そのまま伝播する', async () => {
    const repo = createMockRepo({ getSymlinkConfig: vi.fn().mockRejectedValue(new Error('IPC error')) })
    const useCase = new GetSymlinkConfigDefaultUseCase(repo)

    await expect(useCase.invoke('/repo')).rejects.toThrow('IPC error')
  })
})

describe('SetSymlinkConfigUseCase', () => {
  it('WorktreeRepository.setSymlinkConfig を呼び出す', async () => {
    const config: SymlinkConfig = { patterns: ['*.cache'], source: 'app' }
    const repo = createMockRepo({ setSymlinkConfig: vi.fn().mockResolvedValue(undefined) })
    const errorService = createMockErrorService()
    const useCase = new SetSymlinkConfigDefaultUseCase(repo, errorService)

    await useCase.invoke({ repoPath: '/repo', config })

    expect(repo.setSymlinkConfig).toHaveBeenCalledWith('/repo', config)
    expect(errorService.notifyError).not.toHaveBeenCalled()
  })

  it('Repository がエラーを投げた場合、ErrorNotificationService に通知してから再スローする', async () => {
    const config: SymlinkConfig = { patterns: [], source: 'repo' }
    const error = new Error('save failed')
    const repo = createMockRepo({ setSymlinkConfig: vi.fn().mockRejectedValue(error) })
    const errorService = createMockErrorService()
    const useCase = new SetSymlinkConfigDefaultUseCase(repo, errorService)

    await expect(useCase.invoke({ repoPath: '/repo', config })).rejects.toThrow('save failed')
    expect(errorService.notifyError).toHaveBeenCalledWith('シンボリックリンク設定の保存に失敗しました', error)
  })
})
