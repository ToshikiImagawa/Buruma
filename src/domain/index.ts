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
  commitMessageRules: string | null // null = デフォルトルール使用
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
  commitMessageRules: null,
}

/** コミットメッセージ生成のデフォルトルール */
export const DEFAULT_COMMIT_MESSAGE_RULES = `- 日本語で記述
- プレフィックス付き: [add], [update], [fix], [refactoring], [remove], [docs], [test]
- 簡潔に変更内容を説明（1〜2行）
- コミットメッセージのみを出力し、説明や装飾は含めない`

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

// --- 基本 Git 操作 ---

/** コミット引数 */
export interface CommitArgs {
  worktreePath: string
  message: string
  amend?: boolean
}

/** コミット結果 */
export interface CommitResult {
  hash: string
  message: string
  author: string
  date: string // ISO 8601
}

/** プッシュ引数 */
export interface PushArgs {
  worktreePath: string
  remote?: string
  branch?: string
  setUpstream?: boolean
}

/** プッシュ結果 */
export interface PushResult {
  remote: string
  branch: string
  success: boolean
  upToDate: boolean
}

/** プル引数 */
export interface PullArgs {
  worktreePath: string
  remote?: string
  branch?: string
}

/** プル結果 */
export interface PullResult {
  remote: string
  branch: string
  summary: {
    changes: number
    insertions: number
    deletions: number
  }
  conflicts: string[]
}

/** フェッチ引数 */
export interface FetchArgs {
  worktreePath: string
  remote?: string
}

/** フェッチ結果 */
export interface FetchResult {
  remote: string
}

/** ブランチ作成引数 */
export interface BranchCreateArgs {
  worktreePath: string
  name: string
  startPoint?: string
}

/** ブランチチェックアウト引数 */
export interface BranchCheckoutArgs {
  worktreePath: string
  branch: string
}

/** ブランチ削除引数 */
export interface BranchDeleteArgs {
  worktreePath: string
  branch: string
  remote?: boolean
  force?: boolean
}

/** リセット引数 */
export interface ResetArgs {
  worktreePath: string
  mode: 'soft' | 'mixed' | 'hard'
  target: string // コミットハッシュ
}

/** Git 進捗イベント */
export interface GitProgressEvent {
  operation: string
  phase: string
  progress?: number // 0-100, undefined = indeterminate
}

// --- 高度な Git 操作 ---

/** マージオプション */
export interface MergeOptions {
  worktreePath: string
  branch: string
  strategy: 'fast-forward' | 'no-ff'
}

/** マージ結果 */
export interface MergeResult {
  status: 'success' | 'conflict' | 'already-up-to-date'
  conflictFiles?: string[]
  mergeCommit?: string
}

/** マージ状態 */
export interface MergeStatus {
  isMerging: boolean
  branch?: string
  conflictFiles?: string[]
}

/** リベースオプション */
export interface RebaseOptions {
  worktreePath: string
  onto: string
}

/** インタラクティブリベースオプション */
export interface InteractiveRebaseOptions {
  worktreePath: string
  onto: string
  steps: RebaseStep[]
}

/** リベースステップ */
export interface RebaseStep {
  hash: string
  message: string
  action: RebaseAction
  order: number
}

/** リベースアクション */
export type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop'

/** リベース結果 */
export interface RebaseResult {
  status: 'success' | 'conflict' | 'aborted'
  conflictFiles?: string[]
  currentStep?: number
  totalSteps?: number
}

/** スタッシュ保存オプション */
export interface StashSaveOptions {
  worktreePath: string
  message?: string
  includeUntracked?: boolean
}

/** スタッシュエントリ */
export interface StashEntry {
  index: number
  message: string
  date: string
  branch: string
  hash: string
}

/** チェリーピックオプション */
export interface CherryPickOptions {
  worktreePath: string
  commits: string[]
}

/** チェリーピック結果 */
export interface CherryPickResult {
  status: 'success' | 'conflict'
  conflictFiles?: string[]
  appliedCommits: string[]
}

/** コンフリクトファイル */
export interface ConflictFile {
  filePath: string
  status: 'conflicted' | 'resolved'
  conflictType: 'content' | 'rename' | 'delete'
}

/** 3ウェイマージ内容 */
export interface ThreeWayContent {
  base: string
  ours: string
  theirs: string
  merged: string
}

/** コンフリクト解決オプション */
export interface ConflictResolveOptions {
  worktreePath: string
  filePath: string
  resolution: ConflictResolution
}

/** コンフリクト解決方式 */
export type ConflictResolution = { type: 'ours' } | { type: 'theirs' } | { type: 'manual'; content: string }

/** コンフリクト一括解決オプション */
export interface ConflictResolveAllOptions {
  worktreePath: string
  strategy: 'ours' | 'theirs'
}

/** タグ情報 */
export interface TagInfo {
  name: string
  hash: string
  message?: string
  date: string
  type: 'lightweight' | 'annotated'
  tagger?: string
}

/** タグ作成オプション */
export interface TagCreateOptions {
  worktreePath: string
  tagName: string
  commitHash?: string
  type: 'lightweight' | 'annotated'
  message?: string
}

/** 操作進捗イベント */
export interface OperationProgress {
  operationType: 'merge' | 'rebase' | 'cherry-pick'
  status: 'in-progress' | 'completed' | 'failed' | 'conflict'
  message: string
  currentStep?: number
  totalSteps?: number
}

// --- Claude Code 連携 ---

/** Claude Code セッション状態 */
export type SessionStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error'

/** Claude Code セッション情報 */
export interface ClaudeSession {
  worktreePath: string
  status: SessionStatus
  pid: number | null
  startedAt: string | null // ISO 8601
  error: string | null
}

/** Claude Code 認証ステータス */
export interface ClaudeAuthStatus {
  authenticated: boolean
  accountEmail?: string
}

/** Claude Code コマンド */
export interface ClaudeCommand {
  worktreePath: string
  type: ClaudeCommandType
  input: string
}

export type ClaudeCommandType = 'general' | 'git-delegation' | 'review' | 'explain'

/** コミットメッセージ生成リクエスト */
export interface GenerateCommitMessageArgs {
  worktreePath: string
  diffText: string
}

/** Claude Code 出力 */
export interface ClaudeOutput {
  worktreePath: string
  stream: 'stdout' | 'stderr'
  content: string
  timestamp: string // ISO 8601
}

/** 差分ターゲット（レビュー・解説対象の指定） */
export type DiffTarget =
  | { type: 'working'; staged: boolean }
  | { type: 'commits'; from: string; to: string }
  | { type: 'branches'; from: string; to: string }

/** レビューコメント重大度 */
export type ReviewSeverity = 'info' | 'warning' | 'error'

/** レビューコメント */
export interface ReviewComment {
  id: string
  filePath: string
  lineStart: number
  lineEnd: number
  severity: ReviewSeverity
  message: string
  suggestion?: string
}

/** レビュー結果 */
export interface ReviewResult {
  worktreePath: string
  comments: ReviewComment[]
  summary: string
}

/** 解説結果 */
export interface ExplainResult {
  worktreePath: string
  explanation: string
}
