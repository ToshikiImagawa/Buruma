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
  externalEditor: string | null // null = 未設定（アプリの絶対パス）
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

/** リカバリーリクエスト（確認ダイアログ用） */
export interface RecoveryRequest {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

/** デフォルト設定値 */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  gitPath: null,
  defaultWorkDir: null,
  commitMessageRules: null,
  externalEditor: null,
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
  deleteBranch: boolean
}

/** ブランチ削除結果 */
export type BranchDeleteResult =
  | { type: 'deleted'; branchName: string }
  | { type: 'skipped'; branchName: string; skipReason: string }
  | { type: 'requireForce'; branchName: string }

/** ワークツリー状態変化イベント */
export interface WorktreeChangeEvent {
  repoPath: string
  type: 'added' | 'removed' | 'modified'
  worktreePath: string
}

/** ワークツリー一覧の並び替えオプション */
export type WorktreeSortOrder = 'name' | 'last-updated'

// --- FR_106: シンボリックリンク ---

/** ワークツリー作成結果（worktree + symlink 結果） */
export interface WorktreeCreateResult {
  worktree: WorktreeInfo
  symlink?: SymlinkResult
}

/** シンボリックリンク設定 */
export interface SymlinkConfig {
  patterns: string[]
  source: 'app' | 'repo'
}

/** シンボリックリンク設定保存パラメータ（IPC 用） */
export interface SymlinkConfigSetParams {
  repoPath: string
  config: SymlinkConfig
}

/** シンボリックリンク作成結果 */
export interface SymlinkResult {
  entries: SymlinkResultEntry[]
  totalCreated: number
  totalSkipped: number
  totalFailed: number
}

/** パターン単位のシンボリックリンク結果エントリ */
export interface SymlinkResultEntry {
  pattern: string
  status: 'created' | 'skipped' | 'partial' | 'failed'
  matched: number
  created: number
  failed: number
  reason?: string
}

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
  /** リモートプレフィックスを除いたブランチ名（リモートブランチのみ） */
  localName?: string
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
  force?: boolean
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

/** リベースオプション
 *
 * Git の `git rebase` 引数に対応:
 * - `onto`: 乗せ替え先（newbase）。リベース後のベースとなるブランチ/コミット。
 * - `upstream`: 再適用するコミット範囲の起点（`upstream..HEAD` が対象）。
 *   未指定時は `onto` を兼用し `git rebase <onto>` と等価。
 *   指定時は `git rebase --onto <onto> <upstream>` と等価で、分岐元の付け替えが可能。
 */
export interface RebaseOptions {
  worktreePath: string
  onto: string
  upstream?: string
}

/** インタラクティブリベースオプション */
export interface InteractiveRebaseOptions {
  worktreePath: string
  onto: string
  upstream?: string
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

/** AI コンフリクト解決の進捗 */
export interface ConflictResolvingProgress {
  total: number
  completed: number
  failed: number
}

/** AI コンフリクト解決リクエスト */
export interface ConflictResolveAIRequest {
  worktreePath: string
  filePath: string
  threeWayContent: ThreeWayContent
}

/** AI コンフリクト解決結果（discriminated union） */
export type ConflictResolveResult =
  | {
      worktreePath: string
      filePath: string
      status: 'resolved'
      mergedContent: string
    }
  | {
      worktreePath: string
      filePath: string
      status: 'failed'
      error: string
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
  id: string
  worktreePath: string
  status: SessionStatus
  pid: number | null
  startedAt: string | null // ISO 8601
  error: string | null
  claudeSessionId?: string
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
  model?: string
  sessionId?: string
}

export type ClaudeCommandType = 'general' | 'git-delegation' | 'review' | 'explain'

/** モデル情報 */
export interface ClaudeModelInfo {
  id: string
  label: string
}

/** プリセットモデル（安定エイリアス） */
export const PRESET_MODELS: readonly ClaudeModelInfo[] = [
  { id: 'sonnet', label: 'Claude Sonnet' },
  { id: 'opus', label: 'Claude Opus' },
  { id: 'haiku', label: 'Claude Haiku' },
] as const

export const DEFAULT_MODEL = PRESET_MODELS[0].id

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
  sessionId?: string
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

/** チャットメッセージ */
export type ChatMessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  timestamp: string // ISO 8601
}

/** 会話（ClaudeSession と 1:1 対応、id は ClaudeSession.id と同一） */
export interface Conversation {
  id: string
  worktreePath: string
  title: string
  messages: ChatMessage[]
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  claudeSessionId?: string // CLI --resume 用
}

/** 会話サマリー（一覧表示用） */
export interface ConversationSummary {
  id: string
  title: string
  lastMessagePreview: string
  messageCount: number
  updatedAt: string // ISO 8601
}

/** Git 書き込み操作の種類（UI 自動更新トリガーで利用） */
export type GitOperationType =
  | 'stage'
  | 'unstage'
  | 'commit'
  | 'push'
  | 'pull'
  | 'fetch'
  | 'branch-create'
  | 'branch-checkout'
  | 'branch-delete'
  | 'reset'
  | 'cherry-pick'
  | 'cherry-pick-abort'
  | 'merge'
  | 'merge-abort'
  | 'rebase'
  | 'rebase-abort'
  | 'rebase-continue'
  | 'stash-save'
  | 'stash-pop'
  | 'stash-apply'
  | 'stash-drop'
  | 'stash-clear'
  | 'tag-create'
  | 'tag-delete'
  | 'conflict-resolve'
  | 'conflict-resolve-all'
  | 'conflict-mark-resolved'

/** Git 操作完了イベント */
export interface GitOperationCompletedEvent {
  worktreePath: string
  operation: GitOperationType
}
