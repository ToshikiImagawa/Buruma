import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMultiFileSelection } from '../use-multi-file-selection'

function mouseEvent(opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}) {
  return { ctrlKey: false, metaKey: false, shiftKey: false, ...opts } as React.MouseEvent
}

describe('useMultiFileSelection', () => {
  const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts']

  it('通常クリックで単一選択', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('b.ts', mouseEvent()))

    expect(result.current.selectedFiles).toEqual(new Set(['b.ts']))
  })

  it('通常クリックで選択が切り替わる', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('c.ts', mouseEvent()))

    expect(result.current.selectedFiles).toEqual(new Set(['c.ts']))
  })

  it('Ctrl+Click で追加選択', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('c.ts', mouseEvent({ ctrlKey: true })))

    expect(result.current.selectedFiles).toEqual(new Set(['a.ts', 'c.ts']))
  })

  it('Cmd+Click で追加選択（macOS）', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('b.ts', mouseEvent({ metaKey: true })))

    expect(result.current.selectedFiles).toEqual(new Set(['a.ts', 'b.ts']))
  })

  it('Ctrl+Click で選択解除トグル', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('b.ts', mouseEvent({ ctrlKey: true })))
    act(() => result.current.handleFileSelect('a.ts', mouseEvent({ ctrlKey: true })))

    expect(result.current.selectedFiles).toEqual(new Set(['b.ts']))
  })

  it('Shift+Click で範囲選択', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('c.ts', mouseEvent({ shiftKey: true })))

    expect(result.current.selectedFiles).toEqual(new Set(['a.ts', 'b.ts', 'c.ts']))
  })

  it('Shift+Click で逆方向の範囲選択', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('d.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('b.ts', mouseEvent({ shiftKey: true })))

    expect(result.current.selectedFiles).toEqual(new Set(['b.ts', 'c.ts', 'd.ts']))
  })

  it('Shift+Click で範囲が全選択済みなら解除', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    // a〜c を選択
    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('c.ts', mouseEvent({ shiftKey: true })))
    expect(result.current.selectedFiles).toEqual(new Set(['a.ts', 'b.ts', 'c.ts']))

    // 同じ範囲を Shift+Click → 解除
    act(() => result.current.handleFileSelect('c.ts', mouseEvent({ shiftKey: true })))
    expect(result.current.selectedFiles).toEqual(new Set())
  })

  it('handleSelectAll で全選択', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleSelectAll())

    expect(result.current.selectedFiles).toEqual(new Set(files))
    expect(result.current.isAllSelected).toBe(true)
  })

  it('handleSelectAll で全解除', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleSelectAll())
    act(() => result.current.handleSelectAll())

    expect(result.current.selectedFiles.size).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
  })

  it('clearSelection で選択クリア', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.clearSelection())

    expect(result.current.selectedFiles.size).toBe(0)
  })

  it('空リストで isAllSelected は false', () => {
    const { result } = renderHook(() => useMultiFileSelection([]))

    expect(result.current.isAllSelected).toBe(false)
  })

  it('fileList 変更時に存在しないファイルが選択から除去される', () => {
    const { result, rerender } = renderHook(({ list }) => useMultiFileSelection(list), {
      initialProps: { list: ['a.ts', 'b.ts', 'c.ts'] },
    })

    act(() => result.current.handleFileSelect('a.ts', mouseEvent()))
    act(() => result.current.handleFileSelect('b.ts', mouseEvent({ ctrlKey: true })))
    expect(result.current.selectedFiles).toEqual(new Set(['a.ts', 'b.ts']))

    // b.ts が fileList から消える
    rerender({ list: ['a.ts', 'c.ts'] })

    expect(result.current.selectedFiles).toEqual(new Set(['a.ts']))
  })

  it('lastSelectedFile がない場合の Shift+Click は通常クリックとして動作', () => {
    const { result } = renderHook(() => useMultiFileSelection(files))

    act(() => result.current.handleFileSelect('b.ts', mouseEvent({ shiftKey: true })))

    // lastSelectedFile が null なので通常の単一選択になる
    expect(result.current.selectedFiles).toEqual(new Set(['b.ts']))
  })
})
