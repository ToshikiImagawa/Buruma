import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as useStatusViewModelModule from '../../use-status-viewmodel'
import { StatusView } from '../StatusView'

vi.mock('../../use-status-viewmodel')

describe('StatusView', () => {
  const mockLoadStatus = vi.fn()
  const mockSelectFile = vi.fn()
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ステータスがない場合に空メッセージを表示', () => {
    vi.spyOn(useStatusViewModelModule, 'useStatusViewModel').mockReturnValue({
      status: null,
      loading: false,
      loadStatus: mockLoadStatus,
      selectFile: mockSelectFile,
    })
    render(<StatusView worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('ステータスを取得できません')).toBeDefined()
  })

  it('変更がない場合にメッセージを表示', () => {
    vi.spyOn(useStatusViewModelModule, 'useStatusViewModel').mockReturnValue({
      status: { staged: [], unstaged: [], untracked: [] },
      loading: false,
      loadStatus: mockLoadStatus,
      selectFile: mockSelectFile,
    })
    render(<StatusView worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('変更はありません')).toBeDefined()
  })

  it('ステージ済みファイルを表示する', () => {
    vi.spyOn(useStatusViewModelModule, 'useStatusViewModel').mockReturnValue({
      status: {
        staged: [{ path: 'src/main.ts', status: 'modified' }],
        unstaged: [],
        untracked: [],
      },
      loading: false,
      loadStatus: mockLoadStatus,
      selectFile: mockSelectFile,
    })
    render(<StatusView worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('ステージ済み (1)')).toBeDefined()
    expect(screen.getByText('src/main.ts')).toBeDefined()
  })

  it('ファイルクリックで onFileSelect が呼ばれる', async () => {
    const user = userEvent.setup()
    vi.spyOn(useStatusViewModelModule, 'useStatusViewModel').mockReturnValue({
      status: {
        staged: [{ path: 'src/main.ts', status: 'modified' }],
        unstaged: [],
        untracked: [],
      },
      loading: false,
      loadStatus: mockLoadStatus,
      selectFile: mockSelectFile,
    })
    render(<StatusView worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    await user.click(screen.getAllByText('src/main.ts')[0])
    expect(mockOnFileSelect).toHaveBeenCalledWith('src/main.ts', true)
  })

  it('読み込み中にメッセージを表示', () => {
    vi.spyOn(useStatusViewModelModule, 'useStatusViewModel').mockReturnValue({
      status: null,
      loading: true,
      loadStatus: mockLoadStatus,
      selectFile: mockSelectFile,
    })
    render(<StatusView worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('読み込み中...')).toBeDefined()
  })
})
