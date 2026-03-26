/**
 * IPC 通信の共有型定義
 */

/** IPC 通信の統一レスポンス型 */
export type IPCResult<T> = { success: true; data: T } | { success: false; error: IPCError }

/** IPC エラー情報 */
export interface IPCError {
  code: string
  message: string
  detail?: string
}

/** IPCResult 成功値を生成するヘルパー */
export function ipcSuccess<T>(data: T): IPCResult<T> {
  return { success: true, data }
}

/** IPCResult 失敗値を生成するヘルパー */
export function ipcFailure<T>(code: string, message: string, detail?: string): IPCResult<T> {
  return { success: false, error: { code, message, detail } }
}

/**
 * IPC チャネル定義
 * renderer → main (invoke/handle)
 */
export interface IPCChannelMap {
  'repository:open': {
    args: []
    result: IPCResult<import('../domain').RepositoryInfo | null>
  }
  'repository:open-path': {
    args: [string]
    result: IPCResult<import('../domain').RepositoryInfo | null>
  }
  'repository:validate': { args: [string]; result: IPCResult<boolean> }
  'repository:get-recent': {
    args: []
    result: IPCResult<import('../domain').RecentRepository[]>
  }
  'repository:remove-recent': { args: [string]; result: IPCResult<void> }
  'repository:pin': { args: [{ path: string; pinned: boolean }]; result: IPCResult<void> }
  'settings:get': { args: []; result: IPCResult<import('../domain').AppSettings> }
  'settings:set': {
    args: [Partial<import('../domain').AppSettings>]
    result: IPCResult<void>
  }
  'settings:get-theme': { args: []; result: IPCResult<import('../domain').Theme> }
  'settings:set-theme': { args: [import('../domain').Theme]; result: IPCResult<void> }
}

/** main → renderer イベント */
export interface IPCEventMap {
  'error:notify': import('../domain').ErrorNotification
}

/** Preload API 型（contextBridge 経由で公開） */
export interface ElectronAPI {
  repository: {
    open(): Promise<IPCResult<import('../domain').RepositoryInfo | null>>
    openByPath(
      path: string,
    ): Promise<IPCResult<import('../domain').RepositoryInfo | null>>
    validate(path: string): Promise<IPCResult<boolean>>
    getRecent(): Promise<IPCResult<import('../domain').RecentRepository[]>>
    removeRecent(path: string): Promise<IPCResult<void>>
    pin(path: string, pinned: boolean): Promise<IPCResult<void>>
  }
  settings: {
    get(): Promise<IPCResult<import('../domain').AppSettings>>
    set(settings: Partial<import('../domain').AppSettings>): Promise<IPCResult<void>>
    getTheme(): Promise<IPCResult<import('../domain').Theme>>
    setTheme(theme: import('../domain').Theme): Promise<IPCResult<void>>
  }
  onError(
    callback: (notification: import('../domain').ErrorNotification) => void,
  ): () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
