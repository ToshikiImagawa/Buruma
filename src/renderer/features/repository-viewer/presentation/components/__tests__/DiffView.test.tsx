import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffView } from '../DiffView'

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  DiffEditor: (props: Record<string, unknown>) => (
    <div data-testid="monaco-diff-editor" data-side-by-side={String(props.options && (props.options as Record<string, unknown>).renderSideBySide)} />
  ),
}))

describe('DiffView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.electronAPI.git
    Object.defineProperty(window, 'electronAPI', {
      value: {
        git: {
          fileContents: vi.fn(),
          fileContentsCommit: vi.fn(),
        },
      },
      writable: true,
    })
  })

  it('filePath がない場合にプレースホルダーを表示', () => {
    render(<DiffView worktreePath="/repo" />)
    expect(screen.getByText('ファイルを選択して差分を表示')).toBeDefined()
  })

  it('読み込み中にメッセージを表示', () => {
    vi.mocked(window.electronAPI.git.fileContents).mockReturnValue(new Promise(() => {}))
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    expect(screen.getByText('差分を読み込み中...')).toBeDefined()
  })

  it('差分がない場合にメッセージを表示', async () => {
    vi.mocked(window.electronAPI.git.fileContents).mockResolvedValue({
      success: true,
      data: { original: 'same', modified: 'same', language: 'typescript' },
    })
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    // Wait for async load
    expect(await screen.findByText('差分がありません')).toBeDefined()
  })

  it('差分がある場合に Monaco DiffEditor を表示', async () => {
    vi.mocked(window.electronAPI.git.fileContents).mockResolvedValue({
      success: true,
      data: { original: 'old', modified: 'new', language: 'typescript' },
    })
    render(<DiffView worktreePath="/repo" filePath="src/main.ts" />)
    expect(await screen.findByTestId('monaco-diff-editor')).toBeDefined()
  })
})
