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
  oldPath?: string // リネーム時の元パス
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

// --- リポジトリ閲覧 ---

/** Git ステータス情報 */
export interface GitStatus {
  staged: FileChange[]
  unstaged: FileChange[]
  untracked: string[]
}

/** コミットログクエリ */
export interface GitLogQuery {
  worktreePath: string
  offset: number
  limit: number
  search?: string
}

/** コミットログ結果 */
export interface GitLogResult {
  commits: CommitSummary[]
  total: number
  hasMore: boolean
}

/** コミット概要 */
export interface CommitSummary {
  hash: string
  hashShort: string
  message: string
  author: string
  authorEmail: string
  date: string // ISO 8601
  parents: string[]
  graphLine?: string // ブランチグラフの ASCII 表現
}

/** コミット詳細 */
export interface CommitDetail extends CommitSummary {
  files: CommitFileChange[]
}

/** コミット内のファイル変更 */
export interface CommitFileChange {
  path: string
  status: FileChangeStatus
  additions: number
  deletions: number
}

/** 差分クエリ */
export interface GitDiffQuery {
  worktreePath: string
  filePath?: string
}

/** ファイル差分 */
export interface FileDiff {
  filePath: string
  oldFilePath?: string
  status: FileChangeStatus
  hunks: DiffHunk[]
  isBinary: boolean
}

/** 差分ハンク */
export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  header: string
  lines: DiffLine[]
}

/** 差分行 */
export interface DiffLine {
  type: 'add' | 'delete' | 'context'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

/** ブランチ一覧 */
export interface BranchList {
  current: string
  local: BranchInfo[]
  remote: BranchInfo[]
}

/** ブランチ情報 */
export interface BranchInfo {
  name: string
  hash: string
  isHead: boolean
  upstream?: string
  ahead?: number
  behind?: number
}

/** ファイルツリーノード */
export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  changeStatus?: FileChangeStatus
}

/** ファイルコンテンツ（差分表示用の変更前・変更後テキスト） */
export interface FileContents {
  original: string
  modified: string
  language: string
}

/** 差分表示モード */
export type DiffDisplayMode = 'inline' | 'side-by-side'
