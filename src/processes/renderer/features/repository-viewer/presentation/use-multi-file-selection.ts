import { useCallback, useState } from 'react'

interface FileSelectionState {
  selectedFiles: Set<string>
  lastSelectedFile: string | null
}

export function useMultiFileSelection(fileList: string[]) {
  const [state, setState] = useState<FileSelectionState>({
    selectedFiles: new Set(),
    lastSelectedFile: null,
  })

  const handleFileSelect = useCallback(
    (filePath: string, event: React.MouseEvent) => {
      setState((prev) => {
        const next = { ...prev }

        if (event.shiftKey && prev.lastSelectedFile) {
          // Shift+Click: 範囲トグル（全選択済みなら解除、そうでなければ追加）
          const startIdx = fileList.indexOf(prev.lastSelectedFile)
          const endIdx = fileList.indexOf(filePath)
          if (startIdx !== -1 && endIdx !== -1) {
            const from = Math.min(startIdx, endIdx)
            const to = Math.max(startIdx, endIdx)
            const rangeFiles = fileList.slice(from, to + 1)
            const allSelected = rangeFiles.every((f) => prev.selectedFiles.has(f))
            const newSelected = new Set(prev.selectedFiles)
            for (const f of rangeFiles) {
              if (allSelected) {
                newSelected.delete(f)
              } else {
                newSelected.add(f)
              }
            }
            next.selectedFiles = newSelected
          }
        } else if (event.ctrlKey || event.metaKey) {
          // Ctrl/Cmd+Click: 追加選択 / 解除トグル
          const newSelected = new Set(prev.selectedFiles)
          if (newSelected.has(filePath)) {
            newSelected.delete(filePath)
          } else {
            newSelected.add(filePath)
          }
          next.selectedFiles = newSelected
          next.lastSelectedFile = filePath
        } else {
          // 通常クリック: 単一選択
          next.selectedFiles = new Set([filePath])
          next.lastSelectedFile = filePath
        }

        return next
      })
    },
    [fileList],
  )

  const handleSelectAll = useCallback(() => {
    setState((prev) => {
      if (prev.selectedFiles.size === fileList.length) {
        return { selectedFiles: new Set(), lastSelectedFile: null }
      }
      return { selectedFiles: new Set(fileList), lastSelectedFile: null }
    })
  }, [fileList])

  const clearSelection = useCallback(() => {
    setState({ selectedFiles: new Set(), lastSelectedFile: null })
  }, [])

  return {
    selectedFiles: state.selectedFiles,
    handleFileSelect,
    handleSelectAll,
    clearSelection,
    isAllSelected: fileList.length > 0 && state.selectedFiles.size === fileList.length,
  }
}
