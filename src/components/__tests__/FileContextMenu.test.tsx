import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FileContextMenu } from '../FileContextMenu'

const mockOpenInDefaultApp = { invoke: vi.fn() }
const mockOpenInEditor = { invoke: vi.fn() }

vi.mock('@lib/di', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/di')>()
  return {
    ...actual,
    useResolve: vi.fn((token: symbol) => {
      if (token === Symbol.for('OpenFileInDefaultAppUseCase')) return mockOpenInDefaultApp
      if (token === Symbol.for('OpenInEditorUseCase')) return mockOpenInEditor
      return {}
    }),
  }
})

describe('FileContextMenu', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('右クリックでメニュー項目が表示される', async () => {
    render(
      <FileContextMenu filePath="/test/file.ts">
        <div data-testid="target">target</div>
      </FileContextMenu>,
    )

    fireEvent.contextMenu(screen.getByTestId('target'))

    expect(await screen.findByText('デフォルトアプリで開く')).toBeInTheDocument()
    expect(await screen.findByText('エディタで開く')).toBeInTheDocument()
  })

  it('「デフォルトアプリで開く」クリックで openInDefaultApp.invoke が呼ばれる', async () => {
    render(
      <FileContextMenu filePath="/test/file.ts">
        <div data-testid="target">target</div>
      </FileContextMenu>,
    )

    fireEvent.contextMenu(screen.getByTestId('target'))
    fireEvent.click(await screen.findByText('デフォルトアプリで開く'))

    expect(mockOpenInDefaultApp.invoke).toHaveBeenCalledWith('/test/file.ts')
  })

  it('「エディタで開く」クリックで openInEditor.invoke が呼ばれる', async () => {
    render(
      <FileContextMenu filePath="/test/file.ts">
        <div data-testid="target">target</div>
      </FileContextMenu>,
    )

    fireEvent.contextMenu(screen.getByTestId('target'))
    fireEvent.click(await screen.findByText('エディタで開く'))

    expect(mockOpenInEditor.invoke).toHaveBeenCalledWith('/test/file.ts')
  })
})
