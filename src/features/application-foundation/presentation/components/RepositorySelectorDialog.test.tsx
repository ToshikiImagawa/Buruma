import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { RepositorySelectorDialog } from './RepositorySelectorDialog'
import * as useRepositorySelectorViewModelModule from '../use-repository-selector-viewmodel'

vi.mock('../use-repository-selector-viewmodel')
vi.mock('./RecentRepositoriesList', () => ({
  RecentRepositoriesList: () => <div data-testid="recent-repositories-list" />,
}))

describe('RepositorySelectorDialog', () => {
  const mockOpenWithDialog = vi.fn()
  const mockOnOpenChange = vi.fn()

  it('ダイアログが開いているとき、タイトルと説明が表示される', () => {
    vi.spyOn(
      useRepositorySelectorViewModelModule,
      'useRepositorySelectorViewModel',
    ).mockReturnValue({
      recentRepositories: [],
      currentRepository: null,
      openWithDialog: mockOpenWithDialog,
      openByPath: vi.fn(),
      removeRecent: vi.fn(),
      pin: vi.fn(),
    })

    render(<RepositorySelectorDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('リポジトリを選択')).toBeInTheDocument()
    expect(
      screen.getByText('Git リポジトリを開いて作業を開始します'),
    ).toBeInTheDocument()
  })

  it('「フォルダを選択」ボタンが表示される', () => {
    vi.spyOn(
      useRepositorySelectorViewModelModule,
      'useRepositorySelectorViewModel',
    ).mockReturnValue({
      recentRepositories: [],
      currentRepository: null,
      openWithDialog: mockOpenWithDialog,
      openByPath: vi.fn(),
      removeRecent: vi.fn(),
      pin: vi.fn(),
    })

    render(<RepositorySelectorDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(
      screen.getByRole('button', { name: /フォルダを選択/ }),
    ).toBeInTheDocument()
  })

  it('「フォルダを選択」ボタンをクリックすると openWithDialog が呼ばれる', async () => {
    const user = userEvent.setup()
    vi.spyOn(
      useRepositorySelectorViewModelModule,
      'useRepositorySelectorViewModel',
    ).mockReturnValue({
      recentRepositories: [],
      currentRepository: null,
      openWithDialog: mockOpenWithDialog,
      openByPath: vi.fn(),
      removeRecent: vi.fn(),
      pin: vi.fn(),
    })

    render(<RepositorySelectorDialog open={true} onOpenChange={mockOnOpenChange} />)

    const button = screen.getByRole('button', { name: /フォルダを選択/ })
    await user.click(button)

    expect(mockOpenWithDialog).toHaveBeenCalled()
  })

  it('最近のリポジトリリストが表示される', () => {
    vi.spyOn(
      useRepositorySelectorViewModelModule,
      'useRepositorySelectorViewModel',
    ).mockReturnValue({
      recentRepositories: [],
      currentRepository: null,
      openWithDialog: mockOpenWithDialog,
      openByPath: vi.fn(),
      removeRecent: vi.fn(),
      pin: vi.fn(),
    })

    render(<RepositorySelectorDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getAllByTestId('recent-repositories-list').length).toBeGreaterThan(0)
  })
})
