import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffView } from '../DiffView'

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  DiffEditor: (props: Record<string, unknown>) => (
    <div
      data-testid="monaco-diff-editor"
      data-side-by-side={String(props.options && (props.options as Record<string, unknown>).renderSideBySide)}
    />
  ),
}))

// Mock invokeCommand
const mockInvokeCommand = vi.fn()
vi.mock('@lib/invoke/commands', () => ({
  invokeCommand: (...args: unknown[]) => mockInvokeCommand(...args),
}))

// Mock Claude hooks
vi.mock('@/features/claude-code-integration/presentation/use-claude-auth', () => ({
  useClaudeAuth: () => ({ authStatus: { authenticated: false }, isAuthChecking: false, isLoggingIn: false }),
}))

vi.mock('@/features/claude-code-integration/presentation/use-claude-review-viewmodel', () => ({
  useClaudeReviewViewModel: () => ({
    reviewComments: [],
    reviewSummary: '',
    isReviewing: false,
    requestReview: vi.fn(),
  }),
}))

vi.mock('@/features/claude-code-integration/presentation/use-claude-explain-viewmodel', () => ({
  useClaudeExplainViewModel: () => ({
    explanation: '',
    isExplaining: false,
    requestExplain: vi.fn(),
  }),
}))

describe('DiffView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filePath がない場合にプレースホルダーを表示', () => {
    render(<DiffView worktreePath="/repo" />)
    expect(screen.getByText('ファイルを選択して差分を表示')).toBeDefined()
  })

  it('読み込み中にメッセージを表示', () => {
    mockInvokeCommand.mockReturnValue(new Promise(() => {}))
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    expect(screen.getByText('差分を読み込み中...')).toBeDefined()
  })

  it('差分がない場合にメッセージを表示', async () => {
    mockInvokeCommand.mockResolvedValue({
      success: true,
      data: { original: 'same', modified: 'same', language: 'typescript' },
    })
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    // Wait for async load
    expect(await screen.findByText('差分がありません')).toBeDefined()
  })

  it('差分がある場合に Monaco DiffEditor を表示', async () => {
    mockInvokeCommand.mockResolvedValue({
      success: true,
      data: { original: 'old', modified: 'new', language: 'typescript' },
    })
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    expect(await screen.findByTestId('monaco-diff-editor')).toBeDefined()
  })
})
