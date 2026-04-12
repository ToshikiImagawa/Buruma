import type { BranchList } from '@domain'
import type { WorktreeRepository } from '../repositories/worktree-repository'
import { describe, expect, it, vi } from 'vitest'
import { GetBranchesDefaultUseCase } from '../usecases/get-branches-usecase'

function createMockRepository(overrides: Partial<WorktreeRepository> = {}): WorktreeRepository {
  return {
    list: vi.fn(),
    getStatus: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    suggestPath: vi.fn(),
    checkDirty: vi.fn(),
    getBranches: vi.fn(),
    onChanged: vi.fn(),
    ...overrides,
  } as WorktreeRepository
}

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
    const repo = createMockRepository({
      getBranches: vi.fn().mockResolvedValue(branchList),
    })
    const useCase = new GetBranchesDefaultUseCase(repo)

    const result = await useCase.invoke('/repo/worktree')

    expect(repo.getBranches).toHaveBeenCalledWith('/repo/worktree')
    expect(result).toEqual(branchList)
    expect(result.local).toHaveLength(2)
    expect(result.remote).toHaveLength(1)
  })

  it('Repository がエラーを投げた場合、そのまま伝播する', async () => {
    const repo = createMockRepository({
      getBranches: vi.fn().mockRejectedValue(new Error('IPC error')),
    })
    const useCase = new GetBranchesDefaultUseCase(repo)

    await expect(useCase.invoke('/repo')).rejects.toThrow('IPC error')
  })
})
