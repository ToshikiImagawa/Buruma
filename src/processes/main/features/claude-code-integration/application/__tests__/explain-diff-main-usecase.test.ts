import type { ClaudeOutputParser } from '../repositories/claude-output-parser'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'
import { describe, expect, it, vi } from 'vitest'
import { ExplainDiffMainUseCase } from '../usecases/explain-diff-main-usecase'

function createMockRepository(): ClaudeProcessRepository {
  return {
    generateText: vi.fn().mockResolvedValue('## 概要\n変更の目的は...'),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    getSession: vi.fn(),
    getAllSessions: vi.fn(),
    getOutputHistory: vi.fn(),
    stopAllSessions: vi.fn(),
    onOutput: vi.fn(),
    onSessionChanged: vi.fn(),
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }
}

function createMockParser(): ClaudeOutputParser {
  return {
    parseReviewComments: vi.fn(),
    parseExplanation: vi.fn().mockReturnValue('## 概要\n変更の目的は...'),
  }
}

describe('ExplainDiffMainUseCase', () => {
  it('差分テキストからプロンプトを構築し generateText を呼ぶ', async () => {
    const repo = createMockRepository()
    const parser = createMockParser()
    const useCase = new ExplainDiffMainUseCase(repo, parser)

    const result = await useCase.invoke({
      worktreePath: '/repo',
      diffTarget: { type: 'commits', from: 'abc', to: 'def' },
      diffText: '+added line',
    })

    expect(repo.generateText).toHaveBeenCalledWith('/repo', expect.stringContaining('+added line'))
    expect(parser.parseExplanation).toHaveBeenCalled()
    expect(result.worktreePath).toBe('/repo')
    expect(result.explanation).toBe('## 概要\n変更の目的は...')
  })

  it('空の差分テキストの場合はデフォルトメッセージを返す', async () => {
    const repo = createMockRepository()
    const parser = createMockParser()
    const useCase = new ExplainDiffMainUseCase(repo, parser)

    const result = await useCase.invoke({
      worktreePath: '/repo',
      diffTarget: { type: 'working', staged: true },
      diffText: '  ',
    })

    expect(repo.generateText).not.toHaveBeenCalled()
    expect(result.explanation).toBe('解説対象の差分がありません')
  })

  it('generateText が失敗した場合はエラーを伝播する', async () => {
    const repo = createMockRepository()
    ;(repo.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'))
    const parser = createMockParser()
    const useCase = new ExplainDiffMainUseCase(repo, parser)

    await expect(
      useCase.invoke({
        worktreePath: '/repo',
        diffTarget: { type: 'branches', from: 'main', to: 'feature' },
        diffText: '+line',
      }),
    ).rejects.toThrow('timeout')
  })
})
