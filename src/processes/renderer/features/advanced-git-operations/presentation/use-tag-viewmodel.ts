import { useCallback } from 'react'
import type { TagCreateOptions } from '@domain'
import { useResolve } from '@lib/di/v-container-provider'
import { useObservable } from '@lib/hooks/use-observable'
import { TagViewModelToken } from '../di-tokens'

export function useTagViewModel() {
  const vm = useResolve(TagViewModelToken)
  const loading = useObservable(vm.loading$, false)
  const tags = useObservable(vm.tags$, [])

  return {
    loading,
    tags,
    tagList: useCallback((worktreePath: string) => vm.tagList(worktreePath), [vm]),
    tagCreate: useCallback((options: TagCreateOptions) => vm.tagCreate(options), [vm]),
    tagDelete: useCallback((worktreePath: string, tagName: string) => vm.tagDelete(worktreePath, tagName), [vm]),
  }
}
