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
 * Tauri event を購読し、同期的に unsubscribe 関数を返す。
 *
 * @param eventName - Tauri 側の event 名 (kebab-case 推奨)
 * @param callback - payload を受け取るコールバック
 * @returns unsubscribe 関数 (呼び出すと listener が解除される)
 */
export function listenEventSync<T>(eventName: string, callback: (payload: T) => void): () => void {
  let unlisten: (() => void) | null = null
  let cancelled = false
  listen<T>(eventName, ((evt) => callback(evt.payload)) as EventCallback<T>)
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
