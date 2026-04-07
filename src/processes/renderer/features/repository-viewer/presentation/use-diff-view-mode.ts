import { useCallback, useState } from 'react'

export type DiffViewMode = 'hunk' | 'monaco'

export function useDiffViewMode(initial: DiffViewMode = 'hunk') {
  const [mode, setMode] = useState<DiffViewMode>(initial)

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'hunk' ? 'monaco' : 'hunk'))
  }, [])

  return { mode, setMode, toggleMode }
}
