import { useCallback } from 'react'
import { useResolve } from '@shared/lib/di'
import { useObservable } from '@shared/lib/hooks'
import { ErrorNotificationViewModelToken } from '../di-tokens'

export function useErrorNotificationViewModel() {
  const vm = useResolve(ErrorNotificationViewModelToken)
  const notifications = useObservable(vm.notifications$, [])

  return {
    notifications,
    dismiss: useCallback((id: string) => vm.dismiss(id), [vm]),
    retry: useCallback((id: string) => vm.retry(id), [vm]),
  }
}
