import type { IPCEventMap } from '@lib/ipc'
import type { EventCallback } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'

/**
 * Tauri `listen()` をラップするヘルパー。
 *
 * Tauri の `listen()` は `Promise<UnlistenFn>` を返すため、同期呼び出しインターフェースとの
 * 差異を吸収する必要がある。
 *
 * `listenEventSync` は呼び出し時点で同期的に unsubscribe 関数を返し、内部で非同期 listen() を
 * 解決する。listen() 解決前に unsubscribe が呼ばれた場合は cancel フラグで解決後クリーンアップする。
 */

/**
 * 型安全な Tauri event 購読。イベント名からペイロード型を自動推論する。
 */
export function listenEventSync<K extends keyof IPCEventMap>(
  eventName: K,
  callback: (payload: IPCEventMap[K]) => void,
): () => void
/** @deprecated IPCEventMap に定義されたイベント名を使用してください */
export function listenEventSync<T>(eventName: string, callback: (payload: T) => void): () => void
export function listenEventSync(eventName: string, callback: (payload: unknown) => void): () => void {
  let unlisten: (() => void) | null = null
  let cancelled = false
  listen(eventName, ((evt: { payload: unknown }) => callback(evt.payload)) as EventCallback<unknown>)
    .then((fn) => {
      if (cancelled) {
        fn()
      } else {
        unlisten = fn
      }
    })
    .catch((e) => {
      console.error(`[invoke/events] listen(${eventName}) failed:`, e)
    })
  return () => {
    cancelled = true
    if (unlisten) {
      unlisten()
      unlisten = null
    }
  }
}
