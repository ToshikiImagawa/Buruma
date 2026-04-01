import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as useFileTreeViewModelModule from '../../use-file-tree-viewmodel'
import { FileTree } from '../FileTree'

vi.mock('../../use-file-tree-viewmodel')

describe('FileTree', () => {
  const mockLoadTree = vi.fn()
  const mockSelectFile = vi.fn()
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ツリーがない場合にメッセージを表示', () => {
    vi.spyOn(useFileTreeViewModelModule, 'useFileTreeViewModel').mockReturnValue({
      tree: null,
      loading: false,
      loadTree: mockLoadTree,
      selectFile: mockSelectFile,
    })
    render(<FileTree worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('ファイルがありません')).toBeDefined()
  })

  it('ファイルツリーを表示する', () => {
    vi.spyOn(useFileTreeViewModelModule, 'useFileTreeViewModel').mockReturnValue({
      tree: {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'src',
            path: 'src',
            type: 'directory',
            children: [
              { name: 'main.ts', path: 'src/main.ts', type: 'file' },
            ],
          },
          { name: 'README.md', path: 'README.md', type: 'file' },
        ],
      },
      loading: false,
      loadTree: mockLoadTree,
      selectFile: mockSelectFile,
    })
    render(<FileTree worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    expect(screen.getByText('src')).toBeDefined()
    expect(screen.getByText('README.md')).toBeDefined()
  })

  it('ファイルクリックで onFileSelect が呼ばれる', async () => {
    const user = userEvent.setup()
    vi.spyOn(useFileTreeViewModelModule, 'useFileTreeViewModel').mockReturnValue({
      tree: {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          { name: 'README.md', path: 'README.md', type: 'file' },
        ],
      },
      loading: false,
      loadTree: mockLoadTree,
      selectFile: mockSelectFile,
    })
    render(<FileTree worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    await user.click(screen.getAllByText('README.md')[0])
    expect(mockOnFileSelect).toHaveBeenCalledWith('README.md')
  })

  it('ディレクトリクリックで展開・折りたたみする', async () => {
    const user = userEvent.setup()
    vi.spyOn(useFileTreeViewModelModule, 'useFileTreeViewModel').mockReturnValue({
      tree: {
        name: 'root',
        path: '',
        type: 'directory',
        children: [
          {
            name: 'src',
            path: 'src',
            type: 'directory',
            children: [
              { name: 'main.ts', path: 'src/main.ts', type: 'file' },
            ],
          },
        ],
      },
      loading: false,
      loadTree: mockLoadTree,
      selectFile: mockSelectFile,
    })
    render(<FileTree worktreePath="/repo" onFileSelect={mockOnFileSelect} />)
    // 初期状態ではディレクトリは折りたたまれている
    expect(screen.queryByText('main.ts')).toBeNull()
    // クリックで展開
    await user.click(screen.getAllByText('src')[0])
    expect(screen.getByText('main.ts')).toBeDefined()
  })
})
