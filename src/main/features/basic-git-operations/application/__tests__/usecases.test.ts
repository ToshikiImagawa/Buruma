import type { CommitResult, PullResult, PushResult } from '@shared/domain'
import type { GitWriteRepository } from '../repositories/git-write-repository'
import { describe, expect, it, vi } from 'vitest'
import { CheckoutBranchUseCase } from '../usecases/checkout-branch-usecase'
import { CommitUseCase } from '../usecases/commit-usecase'
import { CreateBranchUseCase } from '../usecases/create-branch-usecase'
import { DeleteBranchUseCase } from '../usecases/delete-branch-usecase'
import { FetchUseCase } from '../usecases/fetch-usecase'
import { PullUseCase } from '../usecases/pull-usecase'
import { PushUseCase } from '../usecases/push-usecase'
import { StageAllUseCase } from '../usecases/stage-all-usecase'
import { StageFilesUseCase } from '../usecases/stage-files-usecase'
import { UnstageAllUseCase } from '../usecases/unstage-all-usecase'
import { UnstageFilesUseCase } from '../usecases/unstage-files-usecase'

function createMockRepository(overrides: Partial<GitWriteRepository> = {}): GitWriteRepository {
  return {
    stage: vi.fn().mockResolvedValue(undefined),
    stageAll: vi.fn().mockResolvedValue(undefined),
    unstage: vi.fn().mockResolvedValue(undefined),
    unstageAll: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue({ hash: 'abc123', message: 'test', author: 'tester', date: '2026-04-03' }),
    push: vi.fn().mockResolvedValue({ remote: 'origin', branch: 'main', success: true, upToDate: false }),
    pull: vi.fn().mockResolvedValue({
      remote: 'origin',
      branch: 'main',
      summary: { changes: 1, insertions: 2, deletions: 0 },
      conflicts: [],
    }),
    fetch: vi.fn().mockResolvedValue({ remote: '--all' }),
    branchCreate: vi.fn().mockResolvedValue(undefined),
    branchCheckout: vi.fn().mockResolvedValue(undefined),
    branchDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('StageFilesUseCase', () => {
  it('repository.stage を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new StageFilesUseCase(repo)
    await useCase.invoke({ worktreePath: '/path', files: ['file.ts'] })
    expect(repo.stage).toHaveBeenCalledWith('/path', ['file.ts'])
  })
})

describe('UnstageFilesUseCase', () => {
  it('repository.unstage を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new UnstageFilesUseCase(repo)
    await useCase.invoke({ worktreePath: '/path', files: ['file.ts'] })
    expect(repo.unstage).toHaveBeenCalledWith('/path', ['file.ts'])
  })
})

describe('StageAllUseCase', () => {
  it('repository.stageAll を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new StageAllUseCase(repo)
    await useCase.invoke({ worktreePath: '/path' })
    expect(repo.stageAll).toHaveBeenCalledWith('/path')
  })
})

describe('UnstageAllUseCase', () => {
  it('repository.unstageAll を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new UnstageAllUseCase(repo)
    await useCase.invoke({ worktreePath: '/path' })
    expect(repo.unstageAll).toHaveBeenCalledWith('/path')
  })
})

describe('CommitUseCase', () => {
  it('repository.commit を呼び出して結果を返す', async () => {
    const expected: CommitResult = { hash: 'abc123', message: 'test', author: 'tester', date: '2026-04-03' }
    const repo = createMockRepository({ commit: vi.fn().mockResolvedValue(expected) })
    const useCase = new CommitUseCase(repo)
    const result = await useCase.invoke({ worktreePath: '/path', message: 'test' })
    expect(result).toEqual(expected)
    expect(repo.commit).toHaveBeenCalledWith({ worktreePath: '/path', message: 'test' })
  })
})

describe('PushUseCase', () => {
  it('repository.push を呼び出して結果を返す', async () => {
    const expected: PushResult = { remote: 'origin', branch: 'main', success: true, upToDate: false }
    const repo = createMockRepository({ push: vi.fn().mockResolvedValue(expected) })
    const useCase = new PushUseCase(repo)
    const result = await useCase.invoke({ worktreePath: '/path' })
    expect(result).toEqual(expected)
  })
})

describe('PullUseCase', () => {
  it('repository.pull を呼び出して結果を返す', async () => {
    const expected: PullResult = {
      remote: 'origin',
      branch: 'main',
      summary: { changes: 1, insertions: 2, deletions: 0 },
      conflicts: [],
    }
    const repo = createMockRepository({ pull: vi.fn().mockResolvedValue(expected) })
    const useCase = new PullUseCase(repo)
    const result = await useCase.invoke({ worktreePath: '/path' })
    expect(result).toEqual(expected)
  })
})

describe('FetchUseCase', () => {
  it('repository.fetch を呼び出して結果を返す', async () => {
    const repo = createMockRepository()
    const useCase = new FetchUseCase(repo)
    const result = await useCase.invoke({ worktreePath: '/path' })
    expect(result).toEqual({ remote: '--all' })
  })
})

describe('CreateBranchUseCase', () => {
  it('repository.branchCreate を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new CreateBranchUseCase(repo)
    await useCase.invoke({ worktreePath: '/path', name: 'feature/test', startPoint: 'main' })
    expect(repo.branchCreate).toHaveBeenCalledWith({
      worktreePath: '/path',
      name: 'feature/test',
      startPoint: 'main',
    })
  })
})

describe('CheckoutBranchUseCase', () => {
  it('repository.branchCheckout を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new CheckoutBranchUseCase(repo)
    await useCase.invoke({ worktreePath: '/path', branch: 'main' })
    expect(repo.branchCheckout).toHaveBeenCalledWith({ worktreePath: '/path', branch: 'main' })
  })
})

describe('DeleteBranchUseCase', () => {
  it('repository.branchDelete を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new DeleteBranchUseCase(repo)
    await useCase.invoke({ worktreePath: '/path', branch: 'old-branch', force: true })
    expect(repo.branchDelete).toHaveBeenCalledWith({ worktreePath: '/path', branch: 'old-branch', force: true })
  })
})
