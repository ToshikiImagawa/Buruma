import { useCallback } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { FileTreeViewModelToken } from '../di-tokens'

export function useFileTreeViewModel() {
  const vm = useResolve(FileTreeViewModelToken)
  const tree = useObservable(vm.tree$, null)
  const loading = useObservable(vm.loading$, false)

  return {
    tree,
    loading,
    loadTree: useCallback((worktreePath: string) => vm.loadTree(worktreePath), [vm]),
    selectFile: useCallback((filePath: string) => vm.selectFile(filePath), [vm]),
  }
}
