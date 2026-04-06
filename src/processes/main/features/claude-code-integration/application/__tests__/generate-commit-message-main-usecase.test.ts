import type { AppSettings } from '@domain'
import { DEFAULT_SETTINGS } from '@domain'
import { describe, expect, it, vi } from 'vitest'
import { GenerateCommitMessageMainUseCase } from '../usecases/generate-commit-message-main-usecase'

function createMockRepository() {
  return {
    generateText: vi.fn().mockResolvedValue('generated message'),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    getSession: vi.fn(),
    getAllSessions: vi.fn(),
    getOutputHistory: vi.fn(),
    stopAllSessions: vi.fn(),
    onOutput: vi.fn(),
    onSessionChanged: vi.fn(),
  }
}

function createMockGetSettings(settings: AppSettings = DEFAULT_SETTINGS) {
  return { invoke: vi.fn().mockReturnValue(settings) }
}

describe('GenerateCommitMessageMainUseCase', () => {
  it('diffText からプロンプトを構築し generateText を呼ぶ', async () => {
    const repo = createMockRepository()
    const getSettings = createMockGetSettings()
    const useCase = new GenerateCommitMessageMainUseCase(repo, getSettings)

    const result = await useCase.invoke({ worktreePath: '/repo', diffText: '+added line' })

    expect(result).toBe('generated message')
    expect(repo.generateText).toHaveBeenCalledWith('/repo', expect.stringContaining('+added line'))
    expect(repo.generateText).toHaveBeenCalledWith('/repo', expect.stringContaining('コミットメッセージ'))
  })

  it('カスタムルールが設定されている場合はプロンプトに含まれる', async () => {
    const repo = createMockRepository()
    const getSettings = createMockGetSettings({
      ...DEFAULT_SETTINGS,
      commitMessageRules: '- English only',
    })
    const useCase = new GenerateCommitMessageMainUseCase(repo, getSettings)

    await useCase.invoke({ worktreePath: '/repo', diffText: '+line' })

    expect(repo.generateText).toHaveBeenCalledWith('/repo', expect.stringContaining('- English only'))
  })

  it('diffText が空の場合はエラーを投げる', async () => {
    const repo = createMockRepository()
    const getSettings = createMockGetSettings()
    const useCase = new GenerateCommitMessageMainUseCase(repo, getSettings)

    await expect(useCase.invoke({ worktreePath: '/repo', diffText: '' })).rejects.toThrow(
      'ステージ済みの変更がありません',
    )
    expect(repo.generateText).not.toHaveBeenCalled()
  })

  it('空白のみの diffText もエラーを投げる', async () => {
    const repo = createMockRepository()
    const getSettings = createMockGetSettings()
    const useCase = new GenerateCommitMessageMainUseCase(repo, getSettings)

    await expect(useCase.invoke({ worktreePath: '/repo', diffText: '   ' })).rejects.toThrow(
      'ステージ済みの変更がありません',
    )
  })
})
