import { useEffect, useRef, useState } from 'react'
import type { Observable } from 'rxjs'

/**
 * RxJS Observable を React state に変換する hook。
 *
 * Observable を subscribe し、値が流れるたびに React state を更新する。
 * コンポーネントのアンマウント時や observable の変更時に自動で unsubscribe する。
 * Observable がエラーを発行した場合は re-throw し、React Error Boundary で捕捉可能にする。
 *
 * @template T - Observable が流す値の型
 * @param observable - 購読する Observable
 * @param initialValue - subscribe 前の初期値
 * @return 最新の値
 */
export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue)
  const [error, setError] = useState<unknown>(null)
  const errorRef = useRef<unknown>(null)

  useEffect(() => {
    const subscription = observable.subscribe({
      next: (v) => setValue(v),
      error: (err) => {
        errorRef.current = err
        setError(err)
      },
    })
    return () => subscription.unsubscribe()
  }, [observable])

  if (error !== null) {
    throw errorRef.current
  }

  return value
}
