import type { ConflictResolveAIRequest } from '@domain'
import type { ClaudeRepository } from '../repositories/claude-repository'
import { describe, expect, it, vi } from 'vitest'
import { ResolveConflictUseCase } from '../usecases/resolve-conflict-usecase'

function createMockRepository(overrides: Partial<ClaudeRepository> = {}): ClaudeRepository {
  return {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    getSession: vi.fn(),
    getAllSessions: vi.fn(),
    sendCommand: vi.fn(),
    getOutput: vi.fn(),
    reviewDiff: vi.fn(),
    explainDiff: vi.fn(),
    onOutput: vi.fn().mockReturnValue(() => {}),
    onSessionChanged: vi.fn().mockReturnValue(() => {}),
    onCommandCompleted: vi.fn().mockReturnValue(() => {}),
    onReviewResult: vi.fn().mockReturnValue(() => {}),
    onExplainResult: vi.fn().mockReturnValue(() => {}),
    resolveConflict: vi.fn().mockResolvedValue(undefined),
    onConflictResolved: vi.fn().mockReturnValue(() => {}),
    generateCommitMessage: vi.fn(),
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

describe('ResolveConflictUseCase', () => {
  const request: ConflictResolveAIRequest = {
    worktreePath: '/repo',
    filePath: 'src/index.ts',
    threeWayContent: {
      base: 'base content',
      ours: 'ours content',
      theirs: 'theirs content',
      merged: '',
    },
  }

  it('リポジトリの resolveConflict を呼び出す', async () => {
    const repo = createMockRepository()
    const useCase = new ResolveConflictUseCase(repo)

    await useCase.invoke(request)

    expect(repo.resolveConflict).toHaveBeenCalledWith(request)
  })

  it('リポジトリがエラーを投げた場合にそのまま再スローする', async () => {
    const repo = createMockRepository({
      resolveConflict: vi.fn().mockRejectedValue(new Error('IPC error')),
    })
    const useCase = new ResolveConflictUseCase(repo)

    await expect(useCase.invoke(request)).rejects.toThrow('IPC error')
  })
})
