/**
 * Tauri `invoke()` を `IPCResult<T>` にラップする共通ヘルパー。
 *
 * Tauri の `invoke<T>()` は成功時に生の T を返し、失敗時に throw する。
 * この差異を吸収するため、`try/catch` で包んで `IPCResult<T>` 形状に統一する。
 * Repository 層がこのラッパーを直接使用する。
 */

import type { IPCCommandMap, IPCError, IPCResult } from '@lib/ipc'
import { invoke } from '@tauri-apps/api/core'

/**
 * 型安全な Tauri command 呼び出し。コマンド名から引数型・戻り値型を自動推論する。
 */
export async function invokeCommand<K extends keyof IPCCommandMap>(
  cmd: K,
  ...rest: IPCCommandMap[K]['args'] extends void ? [] : [args: IPCCommandMap[K]['args']]
): Promise<IPCResult<IPCCommandMap[K]['result']>>
/** @deprecated IPCCommandMap に定義されたコマンド名を使用してください */
export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<IPCResult<T>>
export async function invokeCommand(cmd: string, args?: Record<string, unknown>): Promise<IPCResult<unknown>> {
  try {
    const data = await invoke(cmd, args)
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
