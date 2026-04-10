/**
 * Tauri API 型定義。
 *
 * Phase IH: ElectronAPI を削除し、Tauri ネイティブの invoke/listen ベースに移行完了。
 * invokeCommand / listenEventSync を直接使用するため、統一的な API 型は不要になった。
 * このファイルは将来の型定義拡張用に保持する。
 */

export type TauriAPI = Record<string, never>
