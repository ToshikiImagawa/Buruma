/**
 * domain 層: エンティティ・型定義
 */

/** リポジトリ情報 */
export interface RepositoryInfo {
  path: string
  name: string
  isValid: boolean
}

/** 最近のリポジトリ */
export interface RecentRepository {
  path: string
  name: string
  lastAccessed: string // ISO 8601
  pinned: boolean
}

/** アプリケーション設定 */
export interface AppSettings {
  theme: Theme
  gitPath: string | null // null = システムデフォルト
  defaultWorkDir: string | null
}

/** テーマ */
export type Theme = 'light' | 'dark' | 'system'

/** エラー通知 */
export interface ErrorNotification {
  id: string
  severity: ErrorSeverity
  title: string
  message: string
  detail?: string
  retryable: boolean
  retryAction?: string // IPC チャネル名
  timestamp: string // ISO 8601
}

/** エラー重大度 */
export type ErrorSeverity = 'info' | 'warning' | 'error'

/** デフォルト設定値 */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  gitPath: null,
  defaultWorkDir: null,
}
