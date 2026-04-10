import { useEffect, useRef } from 'react'
import { useResolve } from '@lib/di/v-container-provider'
import { filter } from 'rxjs/operators'
import { GitRefreshCoordinatorViewModelToken } from '../di-tokens'

/**
 * Git 操作完了時に自動で refresh を実行する Hook。
 *
 * 各 git write 系 UseCase が `Service.notifyOperationCompleted` を呼ぶことでイベントが発火し、
 * `worktreePath` が一致する場合のみ `onCompleted` を呼び出す。
 */
export function useGitRefreshCoordinator(worktreePath: string, onCompleted: () => void): void {
  const vm = useResolve(GitRefreshCoordinatorViewModelToken)
  const callbackRef = useRef(onCompleted)

  useEffect(() => {
    callbackRef.current = onCompleted
  }, [onCompleted])

  useEffect(() => {
    if (!worktreePath) return
    const subscription = vm.operationCompleted$
      .pipe(filter((event) => event.worktreePath === worktreePath))
      .subscribe(() => {
        callbackRef.current()
      })
    return () => subscription.unsubscribe()
  }, [vm, worktreePath])
}
