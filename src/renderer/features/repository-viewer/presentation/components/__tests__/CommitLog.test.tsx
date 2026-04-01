import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as useCommitLogViewModelModule from '../../use-commit-log-viewmodel'
import { CommitLog } from '../CommitLog'

vi.mock('../../use-commit-log-viewmodel')

// テスト環境ではスクロールコンテナに高さがないため仮想スクロールをモック
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number }) => ({
    getTotalSize: () => opts.count * 52,
    getVirtualItems: () =>
      Array.from({ length: opts.count }, (_, i) => ({
        index: i,
        start: i * 52,
        size: 52,
        key: i,
      })),
  }),
}))

describe('CommitLog', () => {
  const mockLoadCommits = vi.fn()
  const mockLoadMore = vi.fn()
  const mockSelectCommit = vi.fn()
  const mockSetSearch = vi.fn()
  const mockOnCommitSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('コミットがない場合にメッセージを表示', () => {
    vi.spyOn(useCommitLogViewModelModule, 'useCommitLogViewModel').mockReturnValue({
      commits: [],
      hasMore: false,
      loading: false,
      selectedCommit: null,
      loadCommits: mockLoadCommits,
      loadMore: mockLoadMore,
      selectCommit: mockSelectCommit,
      setSearch: mockSetSearch,
    })
    render(<CommitLog worktreePath="/repo" onCommitSelect={mockOnCommitSelect} />)
    expect(screen.getByText('コミットがありません')).toBeDefined()
  })

  it('コミット一覧を表示する', () => {
    vi.spyOn(useCommitLogViewModelModule, 'useCommitLogViewModel').mockReturnValue({
      commits: [
        {
          hash: 'abc123full',
          hashShort: 'abc1234',
          message: 'initial commit',
          author: 'dev',
          authorEmail: 'dev@test.com',
          date: '2026-01-01T00:00:00Z',
          parents: [],
        },
      ],
      hasMore: false,
      loading: false,
      selectedCommit: null,
      loadCommits: mockLoadCommits,
      loadMore: mockLoadMore,
      selectCommit: mockSelectCommit,
      setSearch: mockSetSearch,
    })
    render(<CommitLog worktreePath="/repo" onCommitSelect={mockOnCommitSelect} />)
    expect(screen.getByText('initial commit')).toBeDefined()
    expect(screen.getByText('abc1234')).toBeDefined()
  })

  it('コミットクリックで onCommitSelect が呼ばれる', async () => {
    const user = userEvent.setup()
    vi.spyOn(useCommitLogViewModelModule, 'useCommitLogViewModel').mockReturnValue({
      commits: [
        {
          hash: 'abc123full',
          hashShort: 'abc1234',
          message: 'test commit',
          author: 'dev',
          authorEmail: 'dev@test.com',
          date: '2026-01-01T00:00:00Z',
          parents: [],
        },
      ],
      hasMore: false,
      loading: false,
      selectedCommit: null,
      loadCommits: mockLoadCommits,
      loadMore: mockLoadMore,
      selectCommit: mockSelectCommit,
      setSearch: mockSetSearch,
    })
    render(<CommitLog worktreePath="/repo" onCommitSelect={mockOnCommitSelect} />)
    await user.click(screen.getByText('test commit'))
    expect(mockOnCommitSelect).toHaveBeenCalledWith('abc123full')
  })

  it('読み込み中にメッセージを表示', () => {
    vi.spyOn(useCommitLogViewModelModule, 'useCommitLogViewModel').mockReturnValue({
      commits: [],
      hasMore: false,
      loading: true,
      selectedCommit: null,
      loadCommits: mockLoadCommits,
      loadMore: mockLoadMore,
      selectCommit: mockSelectCommit,
      setSearch: mockSetSearch,
    })
    render(<CommitLog worktreePath="/repo" onCommitSelect={mockOnCommitSelect} />)
    expect(screen.getByText('読み込み中...')).toBeDefined()
  })
})
