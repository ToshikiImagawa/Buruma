import { useEffect, useState } from 'react'
import type { Observable } from 'rxjs'

/**
 * RxJS Observable を React state に変換する hook。
 *
 * Observable を subscribe し、値が流れるたびに React state を更新する。
 * コンポーネントのアンマウント時や observable の変更時に自動で unsubscribe する。
 *
 * @template T - Observable が流す値の型
 * @param observable - 購読する Observable
 * @param initialValue - subscribe 前の初期値
 * @return 最新の値
 */
export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    const subscription = observable.subscribe({
      next: (v) => setValue(v),
      error: (err) => {
        console.error('[useObservable] Error:', err)
      },
    })
    return () => subscription.unsubscribe()
  }, [observable])

  return value
}
