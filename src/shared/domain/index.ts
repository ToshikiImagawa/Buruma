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

// --- ワークツリー管理 ---

/** ワークツリー情報（git worktree list --porcelain のパース結果） */
export interface WorktreeInfo {
  path: string
  branch: string | null // detached HEAD の場合 null
  head: string // HEAD コミット SHA（短縮形）
  headMessage: string // HEAD コミットメッセージ（1行目）
  isMain: boolean
  isDirty: boolean
}

/** ワークツリー詳細ステータス */
export interface WorktreeStatus {
  worktree: WorktreeInfo
  staged: FileChange[]
  unstaged: FileChange[]
  untracked: string[]
}

/** ファイル変更情報 */
export interface FileChange {
  path: string
  status: FileChangeStatus
}

/** ファイル変更ステータス */
export type FileChangeStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'

/** ワークツリー作成パラメータ */
export interface WorktreeCreateParams {
  repoPath: string
  worktreePath: string
  branch: string
  createNewBranch: boolean
  startPoint?: string
}

/** ワークツリー削除パラメータ */
export interface WorktreeDeleteParams {
  repoPath: string
  worktreePath: string
  force: boolean
}

/** ワークツリー状態変化イベント */
export interface WorktreeChangeEvent {
  repoPath: string
  type: 'added' | 'removed' | 'modified'
  worktreePath: string
}

/** ワークツリー一覧の並び替えオプション */
export type WorktreeSortOrder = 'name' | 'last-updated'
