import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as useCommitLogViewModelModule from '../../use-commit-log-viewmodel'
import { CommitDetailView } from '../CommitDetailView'

vi.mock('../../use-commit-log-viewmodel')
vi.mock('@lib/di', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/di')>()
  return {
    ...actual,
    useResolve: vi.fn(() => ({ invoke: vi.fn() })),
  }
})

describe('CommitDetailView', () => {
  const mockSelectCommit = vi.fn()
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('コミット詳細が表示される', () => {
    vi.spyOn(useCommitLogViewModelModule, 'useCommitLogViewModel').mockReturnValue({
      commits: [],
      hasMore: false,
      loading: false,
      selectedCommit: {
        hash: 'abc123full',
        hashShort: 'abc1234',
        message: 'fix bug',
        author: 'dev',
        authorEmail: 'dev@test.com',
        date: '2026-01-01T00:00:00Z',
        parents: [],
        files: [{ path: 'src/main.ts', status: 'modified', additions: 5, deletions: 2 }],
      },
      loadCommits: vi.fn(),
      loadMore: vi.fn(),
      selectCommit: mockSelectCommit,
      setSearch: vi.fn(),
    })
    render(<CommitDetailView worktreePath="/repo" commitHash="abc123full" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('fix bug')).toBeDefined()
    expect(screen.getByText('abc1234')).toBeDefined()
    expect(screen.getByText('src/main.ts')).toBeDefined()
  })

  it('ファイルクリックで onFileSelect が呼ばれる', async () => {
    const user = userEvent.setup()
    vi.spyOn(useCommitLogViewModelModule, 'useCommitLogViewModel').mockReturnValue({
      commits: [],
      hasMore: false,
      loading: false,
      selectedCommit: {
        hash: 'abc123full',
        hashShort: 'abc1234',
        message: 'fix bug',
        author: 'dev',
        authorEmail: 'dev@test.com',
        date: '2026-01-01T00:00:00Z',
        parents: [],
        files: [{ path: 'src/main.ts', status: 'modified', additions: 5, deletions: 2 }],
      },
      loadCommits: vi.fn(),
      loadMore: vi.fn(),
      selectCommit: mockSelectCommit,
      setSearch: vi.fn(),
    })
    render(<CommitDetailView worktreePath="/repo" commitHash="abc123full" onFileSelect={mockOnFileSelect} />)
    await user.click(screen.getAllByText('src/main.ts')[0])
    expect(mockOnFileSelect).toHaveBeenCalledWith('src/main.ts')
  })

  it('読み込み中にメッセージを表示', () => {
    vi.spyOn(useCommitLogViewModelModule, 'useCommitLogViewModel').mockReturnValue({
      commits: [],
      hasMore: false,
      loading: false,
      selectedCommit: null,
      loadCommits: vi.fn(),
      loadMore: vi.fn(),
      selectCommit: mockSelectCommit,
      setSearch: vi.fn(),
    })
    render(<CommitDetailView worktreePath="/repo" commitHash="abc123full" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('読み込み中...')).toBeDefined()
  })
})
