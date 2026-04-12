import type { BranchList } from '@domain'
import { describe, expect, it, vi } from 'vitest'
import { GetBranchesDefaultUseCase } from '../usecases/get-branches-usecase'
import { createMockRepo } from './helpers'

describe('GetBranchesUseCase', () => {
  it('WorktreeRepository.getBranches を呼び出して BranchList を返す', async () => {
    const branchList: BranchList = {
      current: 'main',
      local: [
        { name: 'main', hash: 'abc1234', isHead: true },
        { name: 'feature/foo', hash: 'def5678', isHead: false },
      ],
      remote: [{ name: 'origin/main', hash: 'abc1234', isHead: false }],
    }
    const repo = createMockRepo({ getBranches: vi.fn().mockResolvedValue(branchList) })
    const useCase = new GetBranchesDefaultUseCase(repo)

    const result = await useCase.invoke('/repo/worktree')

    expect(repo.getBranches).toHaveBeenCalledWith('/repo/worktree')
    expect(result).toEqual(branchList)
    expect(result.local).toHaveLength(2)
    expect(result.remote).toHaveLength(1)
  })

  it('Repository がエラーを投げた場合、そのまま伝播する', async () => {
    const repo = createMockRepo({ getBranches: vi.fn().mockRejectedValue(new Error('IPC error')) })
    const useCase = new GetBranchesDefaultUseCase(repo)

    await expect(useCase.invoke('/repo')).rejects.toThrow('IPC error')
  })
})
