import type { ClaudeRepository } from '../repositories/claude-repository'
import { describe, expect, it, vi } from 'vitest'
import { GenerateCommitMessageUseCase } from '../usecases/generate-commit-message-usecase'

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
    generateCommitMessage: vi.fn().mockResolvedValue('chore: update'),
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

describe('GenerateCommitMessageUseCase', () => {
  it('rules 未指定時はリポジトリに null を渡す', async () => {
    const repo = createMockRepository()
    const useCase = new GenerateCommitMessageUseCase(repo)

    await useCase.invoke({ worktreePath: '/repo', diffText: 'diff' })

    expect(repo.generateCommitMessage).toHaveBeenCalledWith('/repo', 'diff', null)
  })

  it('rules を指定するとそのままリポジトリに転送する', async () => {
    const repo = createMockRepository()
    const useCase = new GenerateCommitMessageUseCase(repo)

    await useCase.invoke({
      worktreePath: '/repo',
      diffText: 'diff',
      rules: '- Conventional Commits\n- 日本語で記述',
    })

    expect(repo.generateCommitMessage).toHaveBeenCalledWith('/repo', 'diff', '- Conventional Commits\n- 日本語で記述')
  })

  it('rules が null でも null として転送する', async () => {
    const repo = createMockRepository()
    const useCase = new GenerateCommitMessageUseCase(repo)

    await useCase.invoke({ worktreePath: '/repo', diffText: 'diff', rules: null })

    expect(repo.generateCommitMessage).toHaveBeenCalledWith('/repo', 'diff', null)
  })

  it('リポジトリの戻り値をそのまま返す', async () => {
    const repo = createMockRepository({
      generateCommitMessage: vi.fn().mockResolvedValue('feat: add thing'),
    })
    const useCase = new GenerateCommitMessageUseCase(repo)

    const result = await useCase.invoke({ worktreePath: '/repo', diffText: 'diff' })

    expect(result).toBe('feat: add thing')
  })
})
