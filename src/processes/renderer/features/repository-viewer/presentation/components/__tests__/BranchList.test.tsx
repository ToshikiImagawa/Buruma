import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as useBranchListViewModelModule from '../../use-branch-list-viewmodel'
import { BranchList } from '../BranchList'

vi.mock('../../use-branch-list-viewmodel')

describe('BranchList', () => {
  const mockLoadBranches = vi.fn()
  const mockSetSearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ブランチがない場合にメッセージを表示', () => {
    vi.spyOn(useBranchListViewModelModule, 'useBranchListViewModel').mockReturnValue({
      branches: null,
      loading: false,
      search: '',
      loadBranches: mockLoadBranches,
      setSearch: mockSetSearch,
    })
    render(<BranchList worktreePath="/repo" />)
    expect(screen.getByText('ブランチを取得できません')).toBeDefined()
  })

  it('ローカルブランチとリモートブランチを表示する', () => {
    vi.spyOn(useBranchListViewModelModule, 'useBranchListViewModel').mockReturnValue({
      branches: {
        current: 'main',
        local: [
          { name: 'main', hash: 'abc', isHead: true },
          { name: 'feature', hash: 'def', isHead: false },
        ],
        remote: [{ name: 'origin/main', hash: 'abc', isHead: false }],
      },
      loading: false,
      search: '',
      loadBranches: mockLoadBranches,
      setSearch: mockSetSearch,
    })
    render(<BranchList worktreePath="/repo" />)
    expect(screen.getByText('ローカル (2)')).toBeDefined()
    expect(screen.getByText('リモート (1)')).toBeDefined()
    expect(screen.getByText('main')).toBeDefined()
    expect(screen.getByText('feature')).toBeDefined()
    expect(screen.getByText('origin/main')).toBeDefined()
  })

  it('現在のブランチに HEAD マークが表示される', () => {
    vi.spyOn(useBranchListViewModelModule, 'useBranchListViewModel').mockReturnValue({
      branches: {
        current: 'main',
        local: [{ name: 'main', hash: 'abc', isHead: true }],
        remote: [],
      },
      loading: false,
      search: '',
      loadBranches: mockLoadBranches,
      setSearch: mockSetSearch,
    })
    render(<BranchList worktreePath="/repo" />)
    expect(screen.getAllByText('HEAD').length).toBeGreaterThanOrEqual(1)
  })
})
