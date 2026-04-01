import { useCallback } from 'react'
import type { DiffDisplayMode } from '@shared/domain'
import { useResolve } from '@shared/lib/di/v-container-provider'
import { useObservable } from '@shared/lib/hooks/use-observable'
import { DiffViewViewModelToken } from '../di-tokens'

export function useDiffViewViewModel() {
  const vm = useResolve(DiffViewViewModelToken)
  const diffs = useObservable(vm.diffs$, [])
  const displayMode = useObservable(vm.displayMode$, 'inline' as DiffDisplayMode)
  const loading = useObservable(vm.loading$, false)

  return {
    diffs,
    displayMode,
    loading,
    loadDiff: useCallback(
      (worktreePath: string, filePath: string, staged: boolean) => vm.loadDiff(worktreePath, filePath, staged),
      [vm],
    ),
    loadCommitDiff: useCallback(
      (worktreePath: string, hash: string, filePath?: string) => vm.loadCommitDiff(worktreePath, hash, filePath),
      [vm],
    ),
    setDisplayMode: useCallback((mode: DiffDisplayMode) => vm.setDisplayMode(mode), [vm]),
  }
}
