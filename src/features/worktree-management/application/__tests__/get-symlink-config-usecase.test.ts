import { describe, expect, it, vi } from 'vitest'
import { GetSymlinkConfigDefaultUseCase } from '../usecases/get-symlink-config-usecase'
import { createMockRepo } from './helpers'

describe('GetSymlinkConfigUseCase', () => {
  it('リポジトリの getSymlinkConfig を repoPath で呼び出す', async () => {
    const repo = createMockRepo({
      getSymlinkConfig: vi.fn().mockResolvedValue({ patterns: ['node_modules', '.env'], source: 'repo' }),
    })
    const useCase = new GetSymlinkConfigDefaultUseCase(repo)

    const result = await useCase.invoke('/repo/path')

    expect(repo.getSymlinkConfig).toHaveBeenCalledWith('/repo/path')
    expect(result).toEqual({ patterns: ['node_modules', '.env'], source: 'repo' })
  })

  it('リポジトリがエラーを返した場合はそのまま throw する', async () => {
    const repo = createMockRepo({
      getSymlinkConfig: vi.fn().mockRejectedValue(new Error('IPC error')),
    })
    const useCase = new GetSymlinkConfigDefaultUseCase(repo)

    await expect(useCase.invoke('/repo/path')).rejects.toThrow('IPC error')
  })
})
