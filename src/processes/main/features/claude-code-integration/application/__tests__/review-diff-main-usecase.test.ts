import type { ClaudeOutputParser } from '../repositories/claude-output-parser'
import type { ClaudeProcessRepository } from '../repositories/claude-process-repository'
import { describe, expect, it, vi } from 'vitest'
import { ReviewDiffMainUseCase } from '../usecases/review-diff-main-usecase'

function createMockRepository(): ClaudeProcessRepository {
  return {
    generateText: vi.fn().mockResolvedValue('mock output'),
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
    parseReviewComments: vi.fn().mockReturnValue({
      comments: [
        {
          id: 'review-0',
          filePath: 'src/a.ts',
          lineStart: 1,
          lineEnd: 5,
          severity: 'warning' as const,
          message: '問題あり',
        },
      ],
      summary: 'サマリー',
    }),
    parseExplanation: vi.fn(),
  }
}

describe('ReviewDiffMainUseCase', () => {
  it('差分テキストからプロンプトを構築し generateText を呼ぶ', async () => {
    const repo = createMockRepository()
    const parser = createMockParser()
    const useCase = new ReviewDiffMainUseCase(repo, parser)

    const result = await useCase.invoke({
      worktreePath: '/repo',
      diffTarget: { type: 'working', staged: false },
      diffText: '+added line',
    })

    expect(repo.generateText).toHaveBeenCalledWith('/repo', expect.stringContaining('+added line'))
    expect(parser.parseReviewComments).toHaveBeenCalledWith('mock output')
    expect(result.worktreePath).toBe('/repo')
    expect(result.comments).toHaveLength(1)
    expect(result.summary).toBe('サマリー')
  })

  it('空の差分テキストの場合は空の結果を返す', async () => {
    const repo = createMockRepository()
    const parser = createMockParser()
    const useCase = new ReviewDiffMainUseCase(repo, parser)

    const result = await useCase.invoke({
      worktreePath: '/repo',
      diffTarget: { type: 'working', staged: false },
      diffText: '',
    })

    expect(repo.generateText).not.toHaveBeenCalled()
    expect(result.comments).toHaveLength(0)
    expect(result.summary).toBe('レビュー対象の差分がありません')
  })

  it('generateText が失敗した場合はエラーを伝播する', async () => {
    const repo = createMockRepository()
    ;(repo.generateText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('CLI error'))
    const parser = createMockParser()
    const useCase = new ReviewDiffMainUseCase(repo, parser)

    await expect(
      useCase.invoke({
        worktreePath: '/repo',
        diffTarget: { type: 'commits', from: 'a', to: 'b' },
        diffText: '+line',
      }),
    ).rejects.toThrow('CLI error')
  })
})
