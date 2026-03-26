import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as useRepositorySelectorViewModelModule from '../use-repository-selector-viewmodel'
import { RecentRepositoriesList } from './RecentRepositoriesList'

vi.mock('../use-repository-selector-viewmodel')

describe('RecentRepositoriesList', () => {
  const mockOpenByPath = vi.fn()
  const mockRemoveRecent = vi.fn()
  const mockPin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('最近のリポジトリが空の場合、メッセージを表示する', () => {
    vi.spyOn(useRepositorySelectorViewModelModule, 'useRepositorySelectorViewModel').mockReturnValue({
      recentRepositories: [],
      currentRepository: null,
      openWithDialog: vi.fn(),
      openByPath: mockOpenByPath,
      removeRecent: mockRemoveRecent,
      pin: mockPin,
    })

    render(<RecentRepositoriesList />)
    expect(screen.getByText('最近開いたリポジトリはありません')).toBeInTheDocument()
  })

  it('最近のリポジトリ一覧を表示する', () => {
    const mockRepositories = [
      {
        path: '/path/to/repo1',
        name: 'repo1',
        lastAccessed: '2026-03-26T00:00:00Z',
        pinned: false,
      },
      {
        path: '/path/to/repo2',
        name: 'repo2',
        lastAccessed: '2026-03-25T00:00:00Z',
        pinned: true,
      },
    ]

    vi.spyOn(useRepositorySelectorViewModelModule, 'useRepositorySelectorViewModel').mockReturnValue({
      recentRepositories: mockRepositories,
      currentRepository: null,
      openWithDialog: vi.fn(),
      openByPath: mockOpenByPath,
      removeRecent: mockRemoveRecent,
      pin: mockPin,
    })

    render(<RecentRepositoriesList />)
    expect(screen.getAllByText(/repo/).length).toBeGreaterThan(0)
  })

  it('リポジトリ名をクリックすると openByPath が呼ばれる', async () => {
    const user = userEvent.setup()
    const mockRepositories = [
      {
        path: '/path/to/test-repo',
        name: 'test-repo',
        lastAccessed: '2026-03-26T00:00:00Z',
        pinned: false,
      },
    ]

    vi.spyOn(useRepositorySelectorViewModelModule, 'useRepositorySelectorViewModel').mockReturnValue({
      recentRepositories: mockRepositories,
      currentRepository: null,
      openWithDialog: vi.fn(),
      openByPath: mockOpenByPath,
      removeRecent: mockRemoveRecent,
      pin: mockPin,
    })

    render(<RecentRepositoriesList />)
    const repoButton = screen.getByRole('button', { name: /test-repo/ })
    await user.click(repoButton)

    expect(mockOpenByPath).toHaveBeenCalledWith('/path/to/test-repo')
  })

  it('削除ボタンをクリックすると removeRecent が呼ばれる', async () => {
    const user = userEvent.setup()
    const localMockRemoveRecent = vi.fn()
    const mockRepositories = [
      {
        path: '/path/to/single-repo',
        name: 'single-repo',
        lastAccessed: '2026-03-26T00:00:00Z',
        pinned: false,
      },
    ]

    vi.spyOn(useRepositorySelectorViewModelModule, 'useRepositorySelectorViewModel').mockReturnValue({
      recentRepositories: mockRepositories,
      currentRepository: null,
      openWithDialog: vi.fn(),
      openByPath: vi.fn(),
      removeRecent: localMockRemoveRecent,
      pin: vi.fn(),
    })

    const { container } = render(<RecentRepositoriesList />)
    const deleteButtons = container.querySelectorAll('[aria-label="履歴から削除"]')
    await user.click(deleteButtons[0] as Element)

    expect(localMockRemoveRecent).toHaveBeenCalledWith('/path/to/single-repo')
  })

  it('ピン留めボタンをクリックすると pin が呼ばれる', async () => {
    const user = userEvent.setup()
    const localMockPin = vi.fn()
    const mockRepositories = [
      {
        path: '/path/to/unique-repo',
        name: 'unique-repo',
        lastAccessed: '2026-03-26T00:00:00Z',
        pinned: false,
      },
    ]

    vi.spyOn(useRepositorySelectorViewModelModule, 'useRepositorySelectorViewModel').mockReturnValue({
      recentRepositories: mockRepositories,
      currentRepository: null,
      openWithDialog: vi.fn(),
      openByPath: vi.fn(),
      removeRecent: vi.fn(),
      pin: localMockPin,
    })

    const { container } = render(<RecentRepositoriesList />)
    const pinButtons = container.querySelectorAll('[aria-label="ピン留め"]')
    await user.click(pinButtons[0] as Element)

    expect(localMockPin).toHaveBeenCalledWith('/path/to/unique-repo', true)
  })

  it('ピン留めされたリポジトリが上位に表示される', () => {
    const mockRepositories = [
      {
        path: '/path/to/repo1',
        name: 'repo1',
        lastAccessed: '2026-03-26T00:00:00Z',
        pinned: false,
      },
      {
        path: '/path/to/repo2',
        name: 'repo2',
        lastAccessed: '2026-03-25T00:00:00Z',
        pinned: true,
      },
    ]

    vi.spyOn(useRepositorySelectorViewModelModule, 'useRepositorySelectorViewModel').mockReturnValue({
      recentRepositories: mockRepositories,
      currentRepository: null,
      openWithDialog: vi.fn(),
      openByPath: mockOpenByPath,
      removeRecent: mockRemoveRecent,
      pin: mockPin,
    })

    render(<RecentRepositoriesList />)
    const cards = screen.getAllByRole('button', { name: /repo/ })
    // ピン留めされた repo2 が最初に表示される
    expect(cards[0]).toHaveTextContent('repo2')
  })
})
