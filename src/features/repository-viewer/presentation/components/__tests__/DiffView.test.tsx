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

// Mock UseCase — 安定した参照を保つためオブジェクトを事前定義
const mockGetFileContentsInvoke = vi.fn()
const mockGetFileContentsCommitInvoke = vi.fn()
const mockGetDiffInvoke = vi.fn()
const mockGetDiffStagedInvoke = vi.fn()
const mockGetDiffCommitInvoke = vi.fn()

const stableMocks: Record<string, { invoke: ReturnType<typeof vi.fn> }> = {
  GetFileContentsUseCase: { invoke: mockGetFileContentsInvoke },
  GetFileContentsCommitUseCase: { invoke: mockGetFileContentsCommitInvoke },
  GetDiffUseCase: { invoke: mockGetDiffInvoke },
  GetDiffStagedUseCase: { invoke: mockGetDiffStagedInvoke },
  GetDiffCommitUseCase: { invoke: mockGetDiffCommitInvoke },
}
const fallbackMock = { invoke: vi.fn() }

// Mock useResolve — Token (Symbol.for(key)) に応じて対応する UseCase モックを返す
vi.mock('@lib/di/v-container-provider', () => ({
  useResolve: (token: symbol) => {
    const key = Symbol.keyFor(token)
    return stableMocks[key ?? ''] ?? fallbackMock
  },
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
    mockGetFileContentsInvoke.mockReturnValue(new Promise(() => {}))
    mockGetDiffInvoke.mockReturnValue(new Promise(() => {}))
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    expect(screen.getByText('差分を読み込み中...')).toBeDefined()
  })

  it('差分がない場合にメッセージを表示', async () => {
    mockGetFileContentsInvoke.mockResolvedValue({ original: 'same', modified: 'same', language: 'typescript' })
    mockGetDiffInvoke.mockResolvedValue([])
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    expect(await screen.findByText('差分がありません')).toBeDefined()
  })

  it('差分がある場合に Monaco DiffEditor を表示', async () => {
    mockGetFileContentsInvoke.mockResolvedValue({ original: 'old', modified: 'new', language: 'typescript' })
    mockGetDiffInvoke.mockResolvedValue([])
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    expect(await screen.findByTestId('monaco-diff-editor')).toBeDefined()
  })
})
