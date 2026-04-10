/**
 * Tauri `invoke()` を `IPCResult<T>` にラップする共通ヘルパー。
 *
 * Tauri の `invoke<T>()` は成功時に生の T を返し、失敗時に throw する。
 * この差異を吸収するため、`try/catch` で包んで `IPCResult<T>` 形状に統一する。
 * Repository 層がこのラッパーを直接使用する。
 */

import type { IPCError, IPCResult } from '@lib/ipc'
import { invoke } from '@tauri-apps/api/core'

/**
 * Tauri command を呼び出し、結果を `IPCResult<T>` として返す。
 *
 * @param cmd - Tauri 側の `#[tauri::command]` 関数名 (snake_case)
 * @param args - command 引数 (Rust 側の #[tauri::command] 関数のパラメータにマッピングされる)
 * @returns 成功時は `{ success: true, data }`、失敗時は `{ success: false, error }`
 */
export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<IPCResult<T>> {
  try {
    const data = await invoke<T>(cmd, args)
    return { success: true, data }
  } catch (e) {
    return { success: false, error: toIpcError(e) }
  }
}

function toIpcError(e: unknown): IPCError {
  if (typeof e === 'string') {
    return { code: 'INTERNAL_ERROR', message: e }
  }
  if (e && typeof e === 'object') {
    const obj = e as Record<string, unknown>
    const code = typeof obj.code === 'string' ? obj.code : 'INTERNAL_ERROR'
    const message = typeof obj.message === 'string' ? obj.message : e instanceof Error ? e.message : JSON.stringify(e)
    const detail = typeof obj.detail === 'string' ? obj.detail : undefined
    return detail !== undefined ? { code, message, detail } : { code, message }
  }
  return { code: 'INTERNAL_ERROR', message: String(e) }
}
