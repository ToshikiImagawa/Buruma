/**
 * Tauri 版の API 型エイリアス。
 *
 * Phase IA では `ElectronAPI` 型をそのまま流用するが、Phase IH 以降で
 * Tauri ネイティブの型に置き換える予定の型別名として配置する。
 * 既存 14 caller の TypeScript 型解決を崩さずに shim を通せる。
 */

import type { ElectronAPI } from '@lib/ipc'

/**
 * Phase IA: `TauriAPI` は `ElectronAPI` のエイリアス。
 * `electron-shim.ts` が `window.electronAPI` に合成注入する値の型はこれ。
 * Phase IH 以降、`ElectronAPI` 型を削除した後は、本ファイルに新しい型定義を置く。
 */
export type TauriAPI = ElectronAPI
