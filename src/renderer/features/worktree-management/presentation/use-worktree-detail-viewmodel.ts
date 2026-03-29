import { useResolve } from '@shared/lib/di/v-container-provider'
import { useObservable } from '@shared/lib/hooks/use-observable'
import { WorktreeDetailViewModelToken } from '../di-tokens'

export function useWorktreeDetailViewModel() {
  const vm = useResolve(WorktreeDetailViewModelToken)
  const selectedWorktree = useObservable(vm.selectedWorktree$, null)

  return {
    selectedWorktree,
  }
}
